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
    category_id: str  # Will be converted to PydanticObjectId in service
    sub_category_id: str  # Will be converted to PydanticObjectId in service
    title: str
    description: str
    content: RichTextContent
    priority: TicketPriority = TicketPriority.medium
    severity: TicketSeverity = TicketSeverity.low
    tag_ids: Optional[List[Dict[str, str]]] = Field(default_factory=list)

class TicketUpdate(TicketBase):
    tagIds: Optional[List[str]]

class TicketResponse(BaseModel):
    id: str
    title: str
    description: str
    content: RichTextContent
    category: CategoryResponse
    sub_category: SubCategoryResponse = Field(..., alias="subCategory")
    user_info: UserInfo = Field(..., alias="userInfo")  # or UserResponse
    agent_info: Optional[UserInfo] = Field(None, alias="agentInfo")  # or Optional[UserResponse]
    tag_ids: Optional[List[TagData]] = Field(default_factory=list, alias="tagIds")
    status: TicketStatus
    priority: TicketPriority
    severity: TicketSeverity

    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    closed_at: Optional[datetime] = Field(None, alias="closedAt")

    class Config:
        populate_by_name = True


