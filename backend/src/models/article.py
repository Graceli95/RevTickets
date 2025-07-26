from typing import List
from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag

class Article(Document):
    id: PydanticObjectId = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    tags: List[Link[Tag]] = Field(default_factory=list)
    category: Link[Category] = Field(...)
    title: str = Field(..., description="Title of the article")
    content: str = Field(..., description="Content of the article, can be rich text")
    subcategory: Link[SubCategory] = Field(...)
    vector_ids: List[str] = Field(default_factory=list)

    class Settings:
        name = "articles"