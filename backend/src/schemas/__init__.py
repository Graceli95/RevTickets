"""
Schemas package for the ticketing system.

This package contains all API request/response schemas.
"""

from .file import (
    FileUploadResponse, 
    AttachFilesRequest,
    FileAttachmentResponse
)

__all__ = [
    'FileUploadResponse',
    'AttachFilesRequest',
    'FileAttachmentResponse'
]