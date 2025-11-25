from typing import List, Optional
from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from datetime import datetime, timezone
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag
from src.models.rich_text import RichTextContent

class Article(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    title: str = Field(..., description="Title of the article")
    content: RichTextContent = Field(..., description="Rich text content of the article with HTML, JSON, and plain text formats")
    category_id: Link[Category] = Field(..., description="ID of the category this article belongs to", alias="categoryId")
    subcategory_id: Link[SubCategory] = Field(..., description="ID of the subcategory this article belongs to", alias="subCategoryId")
    tags: List[Link[Tag]] = Field(default_factory=list, description="Tags associated with the article")
    vector_ids: List[str] = Field(default_factory=list, description="Vector IDs for AI search", alias="vectorIds")
    
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")

    class Settings:
        name = "articles"