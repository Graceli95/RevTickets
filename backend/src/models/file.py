"""
ENHANCEMENT L2: FILE ATTACHMENTS

MongoDB document models for file storage and ticket-file relationships
Uses GridFS for efficient file storage and metadata management
"""

from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict


class FileDocument(BaseModel):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - File document model for GridFS metadata
    Stores file information and links to GridFS stored content
    """
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: Optional[str] = Field(alias="_id", default=None)
    filename: str
    content_type: str
    size: int
    upload_date: datetime
    uploaded_by: str  # user_id
    gridfs_id: ObjectId  # GridFS file ID
    md5: Optional[str] = None  # File hash for integrity checking
    is_virus_scanned: bool = False
    virus_scan_result: Optional[str] = None


class TicketFileAttachment(BaseModel):
    """
    ENHANCEMENT L2: FILE ATTACHMENTS - Model for ticket-file relationships
    Links uploaded files to specific tickets
    """
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }
    )
    
    id: Optional[str] = Field(alias="_id", default=None)
    ticket_id: str
    file_id: str
    attached_by: str  # user_id
    attached_at: datetime