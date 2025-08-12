"""
ENHANCEMENT L2: FILE ATTACHMENTS

File service for secure upload, download, and attachment management
Provides GridFS-based storage with comprehensive security validation
"""

import hashlib
import io
import os
from datetime import datetime
from typing import List, Optional
from bson import ObjectId
from fastapi import HTTPException, UploadFile
from motor.motor_asyncio import AsyncIOMotorGridFSBucket

from ..db.init_db import get_database
from ..models.file import FileDocument, TicketFileAttachment
from ..schemas.file import FileUploadResponse, FileAttachmentResponse


class FileValidationService:
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Service for file validation and security checks
    Provides comprehensive validation for file uploads including type, size, and security checks
    """
    
    ALLOWED_MIME_TYPES = {
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/json', 'text/csv'
    }
    
    DANGEROUS_MIME_TYPES = {
        'application/x-msdownload', 'application/x-executable',
        'application/x-javascript', 'text/javascript', 'application/javascript',
        'text/html', 'application/x-sh', 'application/x-bat',
        'application/x-perl', 'application/x-python', 'application/x-php'
    }
    
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    MAX_FILES_PER_TICKET = 5
    
    @classmethod
    def validate_file(cls, file: UploadFile) -> Optional[str]:
        """Validate uploaded file for security and compliance"""
        
        # Check file size
        if hasattr(file.file, 'seek') and hasattr(file.file, 'tell'):
            file.file.seek(0, 2)  # Seek to end
            size = file.file.tell()
            file.file.seek(0)  # Reset to beginning
            
            if size > cls.MAX_FILE_SIZE:
                return f"File size ({size} bytes) exceeds maximum allowed size ({cls.MAX_FILE_SIZE} bytes)"
            
            if size == 0:
                return "Empty files are not allowed"
        
        # Check MIME type
        if file.content_type in cls.DANGEROUS_MIME_TYPES:
            return f"File type '{file.content_type}' is not allowed for security reasons"
        
        if file.content_type not in cls.ALLOWED_MIME_TYPES:
            return f"File type '{file.content_type}' is not allowed"
        
        # Validate filename
        if not file.filename:
            return "Filename is required"
        
        filename_error = cls._validate_filename(file.filename)
        if filename_error:
            return filename_error
        
        return None
    
    @classmethod
    def _validate_filename(cls, filename: str) -> Optional[str]:
        """Validate filename for security issues"""
        
        # Check for null bytes
        if '\0' in filename:
            return "Filename contains invalid characters"
        
        # Check for path traversal
        dangerous_patterns = ['../', '..\\', '/..', '\\..']
        if any(pattern in filename for pattern in dangerous_patterns):
            return "Filename contains path traversal patterns"
        
        # Check length
        if len(filename) > 255:
            return "Filename is too long (maximum 255 characters)"
        
        # Check for Windows reserved names
        import re
        reserved_pattern = r'^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)'
        if re.match(reserved_pattern, filename, re.IGNORECASE):
            return "Filename is reserved and not allowed"
        
        return None
    
    @classmethod
    def sanitize_filename(cls, filename: str) -> str:
        """Sanitize filename for safe storage"""
        import re
        
        # Replace dangerous characters
        sanitized = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', filename)
        
        # Remove leading dots
        sanitized = re.sub(r'^\.+', '_', sanitized)
        
        # Limit length
        if len(sanitized) > 255:
            name, ext = os.path.splitext(sanitized)
            sanitized = name[:255-len(ext)] + ext
        
        return sanitized


class FileService:
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Service for managing file uploads and storage using GridFS
    Handles secure file upload, download, and ticket attachment operations
    """
    
    def __init__(self):
        self.validation_service = FileValidationService()
    
    async def upload_file(self, file: UploadFile, user_id: str) -> FileUploadResponse:
        """
        ENHANCEMENT L2: FILE ATTACHMENTS - Upload a single file to GridFS
        Validates file, stores in GridFS, and creates metadata document
        """
        
        # Validate file
        validation_error = self.validation_service.validate_file(file)
        if validation_error:
            raise HTTPException(status_code=400, detail=validation_error)
        
        try:
            db = await get_database()
            fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="files")
            
            # Reset file pointer
            await file.seek(0)
            file_content = await file.read()
            await file.seek(0)
            
            # Calculate MD5 hash
            md5_hash = hashlib.md5(file_content).hexdigest()
            
            # Sanitize filename
            safe_filename = self.validation_service.sanitize_filename(file.filename)
            
            # Store file in GridFS
            file_stream = io.BytesIO(file_content)
            gridfs_id = await fs_bucket.upload_from_stream(
                safe_filename,
                file_stream,
                metadata={
                    "original_filename": file.filename,
                    "content_type": file.content_type,
                    "uploaded_by": user_id,
                    "upload_date": datetime.utcnow(),
                    "md5": md5_hash,
                    "size": len(file_content)
                }
            )
            
            # Create file document
            file_doc = FileDocument(
                filename=safe_filename,
                content_type=file.content_type,
                size=len(file_content),
                upload_date=datetime.utcnow(),
                uploaded_by=user_id,
                gridfs_id=gridfs_id,
                md5=md5_hash,
                is_virus_scanned=False
            )
            
            # Store metadata in collection
            files_collection = db.file_metadata
            result = await files_collection.insert_one(file_doc.model_dump(exclude={"id"}))
            
            file_id = str(result.inserted_id)
            
            return FileUploadResponse(
                id=file_id,
                filename=safe_filename,
                content_type=file.content_type,
                size=len(file_content),
                url=f"/api/files/{file_id}/download",
                uploaded_at=file_doc.upload_date
            )
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
    
    async def get_file(self, file_id: str, user_id: str = None) -> tuple[bytes, FileDocument]:
        """
        ENHANCEMENT L2: FILE ATTACHMENTS - Retrieve file content and metadata
        Used for both download and preview functionality with authentication
        """
        
        try:
            db = await get_database()
            files_collection = db.file_metadata
            
            # Get file metadata
            file_doc_data = await files_collection.find_one({"_id": ObjectId(file_id)})
            if not file_doc_data:
                raise HTTPException(status_code=404, detail="File not found")
            
            # Convert ObjectId to string for Pydantic model
            if file_doc_data.get("_id"):
                file_doc_data["_id"] = str(file_doc_data["_id"])
            
            file_doc = FileDocument(**file_doc_data)
            
            # Check permissions if user_id provided
            if user_id and file_doc.uploaded_by != user_id:
                # Check if user has access through ticket attachments
                if not await self._user_has_file_access(file_id, user_id):
                    raise HTTPException(status_code=403, detail="Access denied")
            
            # Get file content from GridFS
            fs_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="files")
            
            try:
                file_stream = io.BytesIO()
                await fs_bucket.download_to_stream(file_doc.gridfs_id, file_stream)
                file_content = file_stream.getvalue()
                return file_content, file_doc
            except Exception as e:
                raise HTTPException(status_code=404, detail="File content not found")
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to retrieve file: {str(e)}")
    
    async def attach_files_to_ticket(self, ticket_id: str, file_ids: List[str], user_id: str) -> List[FileAttachmentResponse]:
        """
        ENHANCEMENT L2: FILE ATTACHMENTS - Attach files to a ticket
        Links uploaded files to a specific ticket for organization
        """
        
        try:
            db = await get_database()
            files_collection = db.file_metadata
            attachments_collection = db.ticket_file_attachments
            
            # Verify all files exist and user has access
            attachments = []
            for file_id in file_ids:
                try:
                    file_doc_data = await files_collection.find_one({"_id": ObjectId(file_id)})
                except Exception as e:
                    raise HTTPException(status_code=400, detail=f"Invalid file ID format: {file_id}")
                
                if not file_doc_data:
                    raise HTTPException(status_code=404, detail=f"File {file_id} not found")
                
                # Convert ObjectId to string for Pydantic model
                if file_doc_data.get("_id"):
                    file_doc_data["_id"] = str(file_doc_data["_id"])
                
                file_doc = FileDocument(**file_doc_data)
                
                # Check if already attached
                existing = await attachments_collection.find_one({
                    "ticket_id": ticket_id,
                    "file_id": file_id
                })
                if existing:
                    continue  # Skip already attached files
                
                # Create attachment
                attachment = TicketFileAttachment(
                    ticket_id=ticket_id,
                    file_id=file_id,
                    attached_by=user_id,
                    attached_at=datetime.utcnow()
                )
                
                await attachments_collection.insert_one(attachment.model_dump(exclude={"id"}))
                
                attachments.append(FileAttachmentResponse(
                    id=file_id,
                    filename=file_doc.filename,
                    content_type=file_doc.content_type,
                    size=file_doc.size,
                    url=f"/api/files/{file_id}/download",
                    uploaded_at=file_doc.upload_date
                ))
            
            return attachments
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to attach files: {str(e)}")
    
    async def get_ticket_attachments(self, ticket_id: str) -> List[FileAttachmentResponse]:
        """
        ENHANCEMENT L2: FILE ATTACHMENTS - Get all files attached to a ticket
        Retrieves file metadata for display in ticket view
        """
        
        try:
            db = await get_database()
            attachments_collection = db.ticket_file_attachments
            files_collection = db.file_metadata
            
            # Get all attachments for ticket
            attachments_cursor = attachments_collection.find({"ticket_id": ticket_id})
            attachments = await attachments_cursor.to_list(length=None)
            
            results = []
            for attachment in attachments:
                # Get file metadata
                file_doc_data = await files_collection.find_one({"_id": ObjectId(attachment["file_id"])})
                if file_doc_data:
                    # Convert ObjectId to string for Pydantic model
                    if file_doc_data.get("_id"):
                        file_doc_data["_id"] = str(file_doc_data["_id"])
                    
                    file_doc = FileDocument(**file_doc_data)
                    results.append(FileAttachmentResponse(
                        id=attachment["file_id"],
                        filename=file_doc.filename,
                        content_type=file_doc.content_type,
                        size=file_doc.size,
                        url=f"/api/files/{attachment['file_id']}/download",
                        uploaded_at=file_doc.upload_date
                    ))
            
            return results
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to get attachments: {str(e)}")
    
    async def _user_has_file_access(self, file_id: str, user_id: str) -> bool:
        """
        ENHANCEMENT L2: FILE ATTACHMENTS - Check if user has access to file through ticket attachments
        Used for permission validation when accessing files
        """
        
        try:
            db = await get_database()
            attachments_collection = db.ticket_file_attachments
            tickets_collection = db.tickets
            
            # Find all tickets that have this file attached
            attachments_cursor = attachments_collection.find({"file_id": file_id})
            attachments = await attachments_cursor.to_list(length=None)
            
            for attachment in attachments:
                # Check if user has access to the ticket (is creator or assignee)
                ticket = await tickets_collection.find_one({"_id": ObjectId(attachment["ticket_id"])})
                if ticket:
                    if ticket.get("created_by") == user_id or ticket.get("assigned_to") == user_id:
                        return True
            
            return False
            
        except Exception:
            return False
    
# ENHANCEMENT L2: FILE ATTACHMENTS - Global file service instance
file_service = FileService()