from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from .ticket import Ticket
from datetime import datetime, timezone
from typing import Optional
from .user import User
from .rich_text import RichTextContent

class Comment(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    content: RichTextContent = Field(..., description="Rich text content of the comment with HTML, JSON, and plain text formats")
    ticket: Link[Ticket] = Field(...)
    userId: Link[User] = Field(...)
    createdAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when the comment was created")
    updatedAt: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Timestamp when the comment was last updated")

    class Settings:
        name = "comments"
