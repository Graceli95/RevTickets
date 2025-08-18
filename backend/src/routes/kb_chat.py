# ENHANCEMENT L3: KB CHAT - API endpoints for knowledge base chat

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from src.api.v1.routes.user import get_current_user
from src.models.user import User
from src.services.kb_chat_service import KBChatService
from src.models.chat_session import KBChatSession
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/kb-chat", tags=["KB Chat"])


# Pydantic models for API
class ChatSessionCreate(BaseModel):
    initial_message: Optional[str] = None


class ChatMessage(BaseModel):
    message: str


class ChatSessionResponse(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    message_count: int
    is_active: bool
    topics_discussed: List[str]
    satisfaction_rating: Optional[int]
    converted_to_ticket: bool


class ChatMessageResponse(BaseModel):
    id: str
    message: str
    message_type: str
    timestamp: str
    sources: List[Dict[str, Any]]


class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]]
    session_id: str
    timestamp: str
    error: Optional[str] = None


class SessionRating(BaseModel):
    rating: int  # 1-5


class TicketConversion(BaseModel):
    title: str
    description: str
    priority: str = "medium"
    category_id: Optional[str] = None
    subcategory_id: Optional[str] = None


# API Endpoints
@router.post("/sessions", response_model=ChatSessionResponse)
async def create_chat_session(
    session_data: ChatSessionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new KB chat session"""
    try:
        session = await KBChatService.create_chat_session(
            user_id=str(current_user.id),
            initial_message=session_data.initial_message
        )
        
        return ChatSessionResponse(
            id=str(session.id),
            title=session.title,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
            message_count=session.message_count,
            is_active=session.is_active,
            topics_discussed=session.topics_discussed,
            satisfaction_rating=session.satisfaction_rating,
            converted_to_ticket=session.converted_to_ticket
        )
    except Exception as e:
        logger.error(f"Failed to create chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat session"
        )


@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_user_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_user)
):
    """Get user's chat sessions"""
    try:
        sessions = await KBChatService.get_user_sessions(
            user_id=str(current_user.id),
            limit=limit
        )
        
        return [
            ChatSessionResponse(
                id=str(session.id),
                title=session.title,
                created_at=session.created_at.isoformat(),
                updated_at=session.updated_at.isoformat(),
                message_count=session.message_count,
                is_active=session.is_active,
                topics_discussed=session.topics_discussed,
                satisfaction_rating=session.satisfaction_rating,
                converted_to_ticket=session.converted_to_ticket
            )
            for session in sessions
        ]
    except Exception as e:
        logger.error(f"Failed to get user sessions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat sessions"
        )


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_chat_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific chat session"""
    try:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify ownership
        if session.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat session"
            )
        
        return ChatSessionResponse(
            id=str(session.id),
            title=session.title,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
            message_count=session.message_count,
            is_active=session.is_active,
            topics_discussed=session.topics_discussed,
            satisfaction_rating=session.satisfaction_rating,
            converted_to_ticket=session.converted_to_ticket
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get chat session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve chat session"
        )


@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
async def get_session_messages(
    session_id: str,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get messages for a chat session"""
    try:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify ownership
        if session.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat session"
            )
        
        messages = await session.get_messages(limit=limit)
        messages.reverse()  # Return in chronological order
        
        return [
            ChatMessageResponse(
                id=str(msg.id),
                message=msg.message,
                message_type=msg.message_type,
                timestamp=msg.timestamp.isoformat(),
                sources=msg.sources
            )
            for msg in messages
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get session messages: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )


@router.post("/sessions/{session_id}/messages", response_model=ChatResponse)
async def send_chat_message(
    session_id: str,
    message_data: ChatMessage,
    current_user: User = Depends(get_current_user)
):
    """Send a message to the KB chat and get AI response"""
    try:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify ownership
        if session.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat session"
            )
        
        # Process message and get AI response
        response = await KBChatService.process_message(
            session_id=session_id,
            user_message=message_data.message
        )
        
        return ChatResponse(**response)
        
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Failed to process chat message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process message"
        )


@router.post("/sessions/{session_id}/rate")
async def rate_session(
    session_id: str,
    rating_data: SessionRating,
    current_user: User = Depends(get_current_user)
):
    """Rate a chat session"""
    try:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify ownership
        if session.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat session"
            )
        
        if not (1 <= rating_data.rating <= 5):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Rating must be between 1 and 5"
            )
        
        success = await KBChatService.rate_session(session_id, rating_data.rating)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to rate session"
            )
        
        return {"message": "Session rated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to rate session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to rate session"
        )


@router.post("/sessions/{session_id}/convert-to-ticket")
async def convert_to_ticket(
    session_id: str,
    ticket_data: TicketConversion,
    current_user: User = Depends(get_current_user)
):
    """Convert a chat session to a support ticket"""
    try:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify ownership
        if session.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat session"
            )
        
        if session.converted_to_ticket:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session already converted to ticket"
            )
        
        # Prepare ticket data
        ticket_create_data = {
            "title": ticket_data.title,
            "description": ticket_data.description,
            "priority": ticket_data.priority,
            "category_id": ticket_data.category_id,
            "subcategory_id": ticket_data.subcategory_id,
            "user_id": str(current_user.id)
        }
        
        ticket_id = await KBChatService.convert_to_ticket(session_id, ticket_create_data)
        if not ticket_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to convert chat to ticket"
            )
        
        return {
            "message": "Chat converted to ticket successfully",
            "ticket_id": ticket_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to convert chat to ticket: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to convert chat to ticket"
        )


@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a chat session"""
    try:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat session not found"
            )
        
        # Verify ownership
        if session.user_id != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this chat session"
            )
        
        success = await KBChatService.delete_session(session_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete session"
            )
        
        return {"message": "Session deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete session"
        )


# Administrative endpoints (for agents)
@router.post("/admin/initialize-embeddings")
async def initialize_embeddings(
    current_user: User = Depends(get_current_user)
):
    """Initialize or update vector embeddings for all KB articles in ChromaDB"""
    if current_user.role != "agent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only agents can initialize embeddings"
        )
    
    try:
        from src.services.vector_service import VectorService
        await VectorService.initialize_embeddings()
        return {"message": "ChromaDB embeddings initialization completed"}
        
    except Exception as e:
        logger.error(f"Failed to initialize embeddings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize embeddings"
        )

@router.get("/admin/vector-info")
async def get_vector_info(
    current_user: User = Depends(get_current_user)
):
    """Get information about the ChromaDB vector collection"""
    if current_user.role != "agent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only agents can access vector information"
        )
    
    try:
        from src.services.vector_service import VectorService
        info = VectorService.get_collection_info()
        return info
        
    except Exception as e:
        logger.error(f"Failed to get vector info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get vector information"
        )