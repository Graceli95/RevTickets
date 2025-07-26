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
    categoryId: PydanticObjectId
    subCategoryId: PydanticObjectId
    userId: str
    agentId: Optional[str] = None
    title: str
    description: str
    content: RichTextContent
    status: TicketStatus
    priority: TicketPriority
    severity: TicketSeverity

class TicketCreate(TicketBase):
    tagData: Optional[List[TagData]] = []

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


