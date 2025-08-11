from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """Response schema for file upload"""
    id: str
    filename: str
    content_type: str
    size: int
    url: str
    uploaded_at: datetime


class FileMetadata(BaseModel):
    """File metadata schema for API responses"""
    id: str
    filename: str
    content_type: str
    size: int
    uploaded_at: datetime
    uploaded_by: str
    md5: Optional[str] = None
    is_virus_scanned: bool = False


class AttachFilesRequest(BaseModel):
    """Request schema for attaching files to a ticket"""
    file_ids: List[str] = Field(..., description="List of file IDs to attach")


class FileAttachmentResponse(BaseModel):
    """Response schema for file attachment"""
    id: str
    filename: str
    content_type: str
    size: int
    url: str
    uploaded_at: datetime


class FileValidationError(BaseModel):
    """File validation error schema"""
    filename: str
    error: str
    error_code: str


class BulkUploadResponse(BaseModel):
    """Response schema for bulk file upload"""
    successful_uploads: List[FileUploadResponse]
    failed_uploads: List[FileValidationError]
    total_files: int
    successful_count: int
    failed_count: int