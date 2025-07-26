from beanie import Document, PydanticObjectId
from pydantic import Field
from typing import Optional

class Category(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    name: str
    description: str
    class Settings:
        name = "categories"