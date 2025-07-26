from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from .ticket import Ticket
from datetime import datetime
from typing import Optional
from .user import User

class Comment(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    content: str
    ticket: Link[Ticket] = Field(...)
    userId: Link[User] = Field(...)
    createdAt: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the comment was created")
    updatedAt: datetime = Field(default_factory=datetime.utcnow, description="Timestamp when the comment was last updated")

    class Settings:
        name = "comments"
