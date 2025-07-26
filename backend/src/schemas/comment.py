from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from beanie import PydanticObjectId
from src.models.rich_text import RichTextContent

class UserInfo(BaseModel):
    id: PydanticObjectId
    email: str
    name: Optional[str] = None
class CommentBase(BaseModel):
    content: RichTextContent
    userId: PydanticObjectId  # ID of the user who made the comment
    ticketId: PydanticObjectId  # ID of the ticket the comment is associated with
    createdAt: datetime
    updatedAt: datetime

class CommentCreate(CommentBase):
    pass    

class CommentResponse(BaseModel):
    id: str  # ID of the comment
    content: RichTextContent
    ticketId: str  # ID of the associated ticket
    user: UserInfo  # User information
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True

# feature comment edit
class CommentUpdate(BaseModel):
    content: Optional[RichTextContent] = None

    class Config:
        populate_by_name = True