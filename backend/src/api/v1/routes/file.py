"""
ENHANCEMENT L2: FILE ATTACHMENTS

FastAPI routes for file upload, download, and attachment management
Provides secure file handling with JWT authentication and GridFS storage
"""

import io
from typing import List
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from ....schemas.file import (
    FileUploadResponse, 
    AttachFilesRequest, 
    FileAttachmentResponse
)
from ....services.file_service import file_service
from ....utils.security import get_current_user

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Upload a single file
    
    - **file**: The file to upload (max 5MB)
    - **Returns**: File metadata and download URL
    """
    return await file_service.upload_file(file, str(current_user.id))


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    current_user = Depends(get_current_user)
):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Download a file by ID
    Used for both file downloads and secure preview functionality
    
    - **file_id**: The ID of the file to download
    - **Returns**: File content with appropriate headers
    """
    file_content, file_doc = await file_service.get_file(file_id, str(current_user.id))
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=file_doc.content_type,
        headers={
            "Content-Disposition": f"attachment; filename=\"{file_doc.filename}\"",
            "Content-Length": str(file_doc.size),
            "Cache-Control": "private, max-age=3600"
        }
    )


# ENHANCEMENT L2: FILE ATTACHMENTS - Ticket file attachment routes

@router.post("/tickets/{ticket_id}/attach", response_model=List[FileAttachmentResponse])
async def attach_files_to_ticket(
    ticket_id: str,
    request: AttachFilesRequest,
    current_user = Depends(get_current_user)
):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Attach files to a ticket
    
    - **ticket_id**: The ID of the ticket
    - **file_ids**: List of file IDs to attach
    - **Returns**: List of attached file information
    """
    return await file_service.attach_files_to_ticket(
        ticket_id, 
        request.file_ids, 
        str(current_user.id)
    )


@router.get("/tickets/{ticket_id}", response_model=List[FileAttachmentResponse])
async def get_ticket_files(
    ticket_id: str,
    current_user = Depends(get_current_user)
):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Get all files attached to a ticket
    
    - **ticket_id**: The ID of the ticket
    - **Returns**: List of attached files
    """
    return await file_service.get_ticket_attachments(ticket_id)