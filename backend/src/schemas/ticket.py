from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime
from src.models.enums import TicketStatus, TicketPriority, TicketSeverity
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse
from src.models.rich_text import RichTextContent
from beanie import PydanticObjectId

class TagData(BaseModel):
    key: str
    value: Optional[str] = None

class UserInfo(BaseModel):
    id: PydanticObjectId
    email: str
    name: Optional[str] = None

class TicketBase(BaseModel):
    category_id: PydanticObjectId = Field(..., alias="categoryId")
    sub_category_id: PydanticObjectId = Field(..., alias="subCategoryId") 
    user_id: str = Field(..., alias="userId")
    agent_id: Optional[str] = Field(None, alias="agentId")
    title: str
    description: str
    content: RichTextContent
    status: TicketStatus
    priority: TicketPriority
    severity: TicketSeverity

class TicketCreate(BaseModel):
    category_id: PydanticObjectId
    sub_category_id: PydanticObjectId
    title: str
    description: str
    content: RichTextContent
    priority: TicketPriority = TicketPriority.medium
    severity: TicketSeverity = TicketSeverity.low
    tag_ids: Optional[List[Dict[str, str]]] = []

class TicketUpdate(TicketBase):
    tagIds: Optional[List[str]]

class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    content: RichTextContent
    category: CategoryResponse
    subCategory: SubCategoryResponse
    userInfo: UserInfo  # or UserResponse
    agentInfo: Optional[UserInfo] = None  # or Optional[UserResponse]
    tagData: Optional[List[TagData]] = []
    status: TicketStatus
    priority: TicketPriority
    severity: TicketSeverity

    createdAt: datetime
    updatedAt: datetime
    closedAt: Optional[datetime]

    class Config:
        populate_by_name = True


