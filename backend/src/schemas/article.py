from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from beanie import PydanticObjectId
from src.models.rich_text import RichTextContent
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse

class TagBase(BaseModel):
    key: str
    value: str

class ArticleCreate(BaseModel):
    title: str
    content: RichTextContent
    category_id: str  # Will be converted to PydanticObjectId in service
    subcategory_id: str  # Will be converted to PydanticObjectId in service
    tags: Optional[List[Dict[str, str]]] = Field(default_factory=list)
    vector_ids: Optional[List[str]] = Field(default_factory=list)

class ArticleResponse(BaseModel):
    id: str
    title: str
    content: RichTextContent
    category: CategoryResponse
    subcategory: SubCategoryResponse = Field(..., alias="subCategory")
    tags: List[TagBase] = Field(default_factory=list)
    ai_generated_tags: List[str] = Field(default_factory=list, alias="aiGeneratedTags")
    vector_ids: List[str] = Field(default_factory=list, alias="vectorIds")
    
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")

    class Config:
        populate_by_name = True

class ArticleUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[RichTextContent] = None
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None
    tags: Optional[List[Dict[str, str]]] = None
    vector_ids: Optional[List[str]] = None
