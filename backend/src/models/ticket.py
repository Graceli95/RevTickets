from beanie import Document,Link, PydanticObjectId
from pydantic import Field
from typing import Optional, List, Dict
from datetime import datetime
from .category import Category
from .subcategory import SubCategory
from .enums import TicketStatus, TicketPriority, TicketSeverity
from .user import User
class Ticket(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    categoryId: Link[Category] = Field(..., description="ID of the category this ticket belongs to")
    subCategoryId: Link[SubCategory] = Field(..., description="ID of the subcategory this ticket belongs to")
    userId: Link[User] = Field(..., description="ID of the user who created the ticket")
    agentId: Optional[Link[User]] = Field(None, description="ID of the agent assigned to the ticket (if any)")
    
    title: str = Field(..., description="Title of the ticket")
    description: str = Field(..., description="Detailed description of the ticket")
    content: str=  Field(..., description="Content of the ticket, can be rich text")
    tagIds: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="List of tag IDs associated with the ticket")

    status: TicketStatus = Field(default=TicketStatus.open, description="Status of the ticket") 
    priority: TicketPriority = Field(default=TicketPriority.medium, description="Priority: low, medium, high")
    severity: TicketSeverity = Field(default=TicketSeverity.low, description="Severity of the issue")

    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    closedAt: Optional[datetime] = None

    class Settings:
        name = "tickets"  # MongoDB collection name

    