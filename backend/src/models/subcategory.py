from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from .category import Category
from typing import Optional

class SubCategory(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    name: str
    description: str
    category: Link[Category] = Field(...)

    class Settings:
        name = "subcategories"
