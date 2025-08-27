# ENHANCEMENT L3: KB CHAT - Chat session model for knowledge base conversations

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from beanie import Document
from pydantic import Field
from src.models.user import User
from src.models.enums import ChatType


class ChatMessage(Document):
    """Individual chat message in a KB chat session"""
    
    session_id: str
    user_id: Optional[str] = None  # None for system/AI messages
    message: str
    message_type: str = "user"  # user, assistant, system
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    sources: List[Dict[str, Any]] = Field(default_factory=list)  # Referenced KB articles
    
    class Settings:
        name = "chat_messages"


class KBChatSession(Document):
    """Knowledge base chat session"""
    
    user_id: str
    title: str = "Knowledge Base Chat"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True
    message_count: int = 0
    rating: int = 0
    
    # Metadata for analytics
    topics_discussed: List[str] = Field(default_factory=list)
    articles_referenced: List[str] = Field(default_factory=list)
    satisfaction_rating: Optional[int] = None  # 1-5 rating
    converted_to_ticket: bool = False
    ticket_id: Optional[str] = None
    
    class Settings:
        name = "kb_chat_sessions"
    
    async def add_message(self, message: str, message_type: str = "user", 
                         sources: List[Dict[str, Any]] = None) -> ChatMessage:
        """Add a message to this chat session"""
        
        chat_message = ChatMessage(
            session_id=str(self.id),
            user_id=self.user_id if message_type == "user" else None,
            message=message,
            message_type=message_type,
            sources=sources or []
        )
        
        await chat_message.save()
        
        # Update session metadata
        self.message_count += 1
        self.updated_at = datetime.now(timezone.utc)
        await self.save()
        
        return chat_message
    
    async def get_messages(self, limit: int = 50) -> List[ChatMessage]:
        """Get messages for this chat session"""
        return await ChatMessage.find(
            ChatMessage.session_id == str(self.id)
        ).sort("-timestamp").limit(limit).to_list()
    
    async def mark_converted_to_ticket(self, ticket_id: str):
        """Mark this chat as converted to a ticket"""
        self.converted_to_ticket = True
        self.ticket_id = ticket_id
        await self.save()