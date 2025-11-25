from beanie import Document, Link, PydanticObjectId
from pydantic import Field, BaseModel
from .ticket import Ticket
from datetime import datetime, timezone
from typing import Optional, List
from .user import User
from .rich_text import RichTextContent

class CommentEditHistory(BaseModel):
    """Track the history of edits made to a comment"""
    edited_at: datetime = Field(..., description="When this edit was made")
    previous_content: Optional[RichTextContent] = Field(None, description="The content before this edit")

class Comment(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    content: RichTextContent = Field(..., description="Rich text content of the comment with HTML, JSON, and plain text formats")
    ticket: Link[Ticket] = Field(...)
    user_id: Link[User] = Field(..., alias="userId")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when the comment was created", alias="createdAt")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when the comment was last updated", alias="updatedAt")
    
    # ENHANCEMENT L1 COMMENT EDITING - Edit tracking fields
    edited: bool = Field(default=False, description="Flag indicating if the comment has been edited")
    edit_count: int = Field(default=0, description="Number of times the comment has been edited")
    edit_history: List[CommentEditHistory] = Field(default_factory=list, description="History of all edits made to this comment")

    class Settings:
        name = "comments"
