from beanie import Document,Link, PydanticObjectId
from pydantic import Field
from typing import Optional, List, Dict
from datetime import datetime, timezone
from .category import Category
from .subcategory import SubCategory
from .enums import TicketStatus, TicketPriority, TicketSeverity
from .user import User
from .rich_text import RichTextContent
class Ticket(Document):
    id: Optional[PydanticObjectId] = Field(default=None, alias="_id", description="Primary key (MongoDB ObjectId)")
    category_id: Link[Category] = Field(..., description="ID of the category this ticket belongs to", alias="categoryId")
    sub_category_id: Link[SubCategory] = Field(..., description="ID of the subcategory this ticket belongs to", alias="subCategoryId")
    user_id: Link[User] = Field(..., description="ID of the user who created the ticket", alias="userId")
    agent_id: Optional[Link[User]] = Field(None, description="ID of the agent assigned to the ticket (if any)", alias="agentId")
    
    title: str = Field(..., description="Title of the ticket")
    description: str = Field(..., description="Detailed description of the ticket")
    content: RichTextContent = Field(..., description="Rich text content of the ticket with HTML, JSON, and plain text formats")
    tag_ids: Optional[List[Dict[str, str]]] = Field(default_factory=list, description="List of tag IDs associated with the ticket", alias="tagIds")

    status: TicketStatus = Field(default=TicketStatus.new, description="Status of the ticket") 
    priority: TicketPriority = Field(default=TicketPriority.medium, description="Priority: low, medium, high")
    severity: TicketSeverity = Field(default=TicketSeverity.low, description="Severity of the issue")

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="createdAt")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), alias="updatedAt")
    closed_at: Optional[datetime] = Field(None, alias="closedAt")
    
    # ENHANCEMENT L1 AI TICKET SUMMARY - Store AI-generated summary
    ai_summary: Optional[str] = Field(None, description="AI-generated summary of the ticket")
    summary_generated_at: Optional[datetime] = Field(None, description="When the AI summary was generated")

    class Settings:
        name = "tickets"  # MongoDB collection name

    