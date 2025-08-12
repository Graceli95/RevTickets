"""
ENHANCEMENT L2: FILE ATTACHMENTS

Pydantic schemas for file upload, download, and attachment API responses
Defines the data structures used for file-related API operations
"""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Response schema for file upload
    """
    id: str
    filename: str
    content_type: str
    size: int
    url: str
    uploaded_at: datetime


class AttachFilesRequest(BaseModel):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Request schema for attaching files to a ticket
    """
    file_ids: List[str] = Field(..., description="List of file IDs to attach")


class FileAttachmentResponse(BaseModel):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Response schema for file attachment
    """
    id: str
    filename: str
    content_type: str
    size: int
    url: str
    uploaded_at: datetime