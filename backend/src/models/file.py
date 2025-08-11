from datetime import datetime
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict


class FileDocument(BaseModel):
    """File document model for GridFS metadata"""
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
    """Model for ticket-file relationships"""
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