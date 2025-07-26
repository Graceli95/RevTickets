from beanie import Document, PydanticObjectId
from pydantic import Field
from typing import Optional

class Tag(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    key: str
    value: str
    class Settings:
        name = "tags"