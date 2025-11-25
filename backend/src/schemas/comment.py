from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from beanie import PydanticObjectId
from src.models.rich_text import RichTextContent

class UserInfo(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str  # "user" or "agent" to clearly show user type

class CommentEditHistoryResponse(BaseModel):
    """History of edits made to a comment"""
    edited_at: datetime
    previous_content: Optional[RichTextContent] = None
    
    class Config:
        populate_by_name = True

class CommentBase(BaseModel):
    content: RichTextContent
    user_id: PydanticObjectId = Field(..., alias="userId")  # ID of the user who made the comment
    ticket_id: PydanticObjectId = Field(..., alias="ticketId")  # ID of the ticket the comment is associated with
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

class CommentCreate(BaseModel):
    content: RichTextContent
    # For create, we don't need all the base fields since they'll be set by the service
    
    class Config:
        populate_by_name = True    

class CommentResponse(BaseModel):
    id: str  # ID of the comment
    content: RichTextContent
    ticket_id: str = Field(..., alias="ticketId")  # ID of the associated ticket
    user: UserInfo  # User information
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")
    
    # ENHANCEMENT L1 COMMENT EDITING - Edit tracking fields
    edited: bool = False
    edit_count: int = 0
    edit_history: List[CommentEditHistoryResponse] = Field(default_factory=list)

    class Config:
        populate_by_name = True

# ENHANCEMENT L1 COMMENT EDITING - Comment update request
class CommentUpdate(BaseModel):
    content: Optional[RichTextContent] = None

    class Config:
        populate_by_name = True