from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from beanie import PydanticObjectId

class TagBase(BaseModel):
    key: str
    value: str

class ArticleCreate(BaseModel):
    title: str
    content: str
    tags: Optional[List[Dict[str,str]]] = []
    category_id: PydanticObjectId
    subcategory_id: PydanticObjectId
    vector_ids: Optional[List[str]] = []

class ArticleResponse(BaseModel):
    id: PydanticObjectId
    title: str
    content: str
    tags: List[TagBase]
    category_id: PydanticObjectId
    subcategory_id: PydanticObjectId
    vector_ids: List[str]

class ArticleUpdate(BaseModel):
    title: Optional[str]
    content: Optional[str]
    tags: Optional[List[PydanticObjectId]] 
    category_id: Optional[PydanticObjectId]
    subcategory_id: Optional[PydanticObjectId]
