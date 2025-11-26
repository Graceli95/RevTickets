from pydantic import BaseModel
from typing import Optional
from .category import CategoryResponse
from beanie import PydanticObjectId

class SubCategoryBase(BaseModel):
    name: str
    description: str

class SubCategoryCreate(SubCategoryBase):
    category_id: str  # ID of linked category

class SubCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[str] = None

class SubCategoryResponse(SubCategoryBase):
    id: str
    category: Optional[CategoryResponse] = None