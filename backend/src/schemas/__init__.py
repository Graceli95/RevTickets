"""
Schemas package for the ticketing system.

This package contains all API request/response schemas.
"""

from .file import (
    FileUploadResponse, 
    FileMetadata,
    AttachFilesRequest,
    FileAttachmentResponse,
    FileValidationError,
    BulkUploadResponse
)

__all__ = [
    'FileUploadResponse',
    'FileMetadata', 
    'AttachFilesRequest',
    'FileAttachmentResponse',
    'FileValidationError',
    'BulkUploadResponse'
]