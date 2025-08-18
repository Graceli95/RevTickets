# ENHANCEMENT L3: KB CHAT - Knowledge base chat service with RAG capabilities

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timezone
import logging
from src.models.chat_session import KBChatSession, ChatMessage
from src.models.article import Article
from src.services.vector_service import VectorService
from src.langchain_app.chains.kb_chat import KBChatChain
from beanie import PydanticObjectId

logger = logging.getLogger(__name__)


class KBChatService:
    """Service for knowledge base chat with RAG capabilities"""
    
    @staticmethod
    async def create_chat_session(user_id: str, initial_message: str = None) -> KBChatSession:
        """Create a new KB chat session"""
        
        session = KBChatSession(
            user_id=user_id,
            title=f"Chat - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        await session.save()
        
        if initial_message:
            await session.add_message(initial_message, "user")
        
        logger.info(f"Created KB chat session {session.id} for user {user_id}")
        return session
    
    @staticmethod
    async def get_user_sessions(user_id: str, limit: int = 20) -> List[KBChatSession]:
        """Get chat sessions for a user"""
        return await KBChatSession.find(
            KBChatSession.user_id == user_id
        ).sort("-updated_at").limit(limit).to_list()
    
    @staticmethod
    async def get_session(session_id: str) -> Optional[KBChatSession]:
        """Get a specific chat session"""
        try:
            return await KBChatSession.get(PydanticObjectId(session_id))
        except:
            return None
    
    @staticmethod
    async def process_message(session_id: str, user_message: str) -> Dict[str, Any]:
        """Process a user message and generate AI response with sources"""
        
        session = await KBChatService.get_session(session_id)
        if not session:
            raise ValueError("Chat session not found")
        
        # Add user message to session
        await session.add_message(user_message, "user")
        
        try:
            # Get conversation history for context
            chat_history = await KBChatService._get_chat_history(session)
            
            # Search for relevant articles
            relevant_articles = await VectorService.search_similar_articles(
                user_message, 
                limit=5,
                similarity_threshold=0.6
            )
            
            # Get full article content for context
            article_contexts = await KBChatService._get_article_contexts(relevant_articles)
            
            # Generate AI response using RAG
            ai_response, sources = await KBChatService._generate_rag_response(
                user_message, 
                article_contexts, 
                chat_history
            )
            
            # Add AI response to session
            await session.add_message(ai_response, "assistant", sources)
            
            # Update session metadata
            await KBChatService._update_session_metadata(session, user_message, sources)
            
            return {
                "response": ai_response,
                "sources": sources,
                "session_id": str(session.id),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to process message in session {session_id}: {e}")
            
            # Add fallback response
            fallback_response = "I apologize, but I'm having trouble processing your request right now. Please try rephrasing your question or contact support for assistance."
            await session.add_message(fallback_response, "assistant")
            
            return {
                "response": fallback_response,
                "sources": [],
                "session_id": str(session.id),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": "Processing failed"
            }
    
    @staticmethod
    async def _get_chat_history(session: KBChatSession) -> List[Dict[str, str]]:
        """Get formatted chat history for context"""
        
        messages = await session.get_messages(limit=10)
        messages.reverse()  # Chronological order
        
        history = []
        for msg in messages:
            history.append({
                "role": "user" if msg.message_type == "user" else "assistant",
                "content": msg.message
            })
        
        return history
    
    @staticmethod
    async def _get_article_contexts(relevant_articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get full article content for RAG context"""
        
        contexts = []
        for article_info in relevant_articles:
            try:
                article = await Article.get(PydanticObjectId(article_info['article_id']))
                if article:
                    # Extract content
                    content = ""
                    if hasattr(article.content, 'text') and article.content.text:
                        content = article.content.text
                    elif hasattr(article.content, 'html') and article.content.html:
                        import re
                        content = re.sub(r'<[^>]+>', '', article.content.html).strip()
                    
                    contexts.append({
                        "id": str(article.id),
                        "title": article.title,
                        "content": content,
                        "similarity": article_info['similarity']
                    })
            except Exception as e:
                logger.error(f"Failed to load article {article_info['article_id']}: {e}")
                continue
        
        return contexts
    
    @staticmethod
    async def _generate_rag_response(message: str, contexts: List[Dict[str, Any]], 
                                   history: List[Dict[str, str]]) -> Tuple[str, List[Dict[str, Any]]]:
        """Generate AI response using RAG with article contexts"""
        
        try:
            chain = KBChatChain()
            response, used_sources = await chain.generate_response(message, contexts, history)
            
            # Format sources for frontend
            sources = []
            for source in used_sources:
                sources.append({
                    "id": source["id"],
                    "title": source["title"],
                    "excerpt": source.get("excerpt", ""),
                    "relevance": source.get("relevance", 0.0),
                    "url": f"/knowledge-base/{source['id']}"
                })
            
            return response, sources
            
        except Exception as e:
            logger.error(f"RAG response generation failed: {e}")
            
            # Fallback to simple response with source listing
            if contexts:
                source_titles = [ctx["title"] for ctx in contexts[:3]]
                response = f"Based on your question, you might find these articles helpful: {', '.join(source_titles)}. Please check them for detailed information."
                sources = [{
                    "id": ctx["id"],
                    "title": ctx["title"],
                    "excerpt": ctx["content"][:200] + "..." if len(ctx["content"]) > 200 else ctx["content"],
                    "relevance": ctx["similarity"],
                    "url": f"/knowledge-base/{ctx['id']}"
                } for ctx in contexts[:3]]
                return response, sources
            else:
                return "I couldn't find specific articles related to your question. Please try rephrasing or contact support.", []
    
    @staticmethod
    async def _update_session_metadata(session: KBChatSession, message: str, sources: List[Dict[str, Any]]):
        """Update session metadata for analytics"""
        
        try:
            # Extract topics from message (simple keyword extraction)
            keywords = [word.lower() for word in message.split() 
                       if len(word) > 3 and word.isalpha()]
            
            # Update topics
            for keyword in keywords[:5]:  # Limit to 5 keywords
                if keyword not in session.topics_discussed:
                    session.topics_discussed.append(keyword)
            
            # Update referenced articles
            for source in sources:
                article_id = source["id"]
                if article_id not in session.articles_referenced:
                    session.articles_referenced.append(article_id)
            
            await session.save()
            
        except Exception as e:
            logger.error(f"Failed to update session metadata: {e}")
    
    @staticmethod
    async def rate_session(session_id: str, rating: int) -> bool:
        """Rate a chat session (1-5 stars)"""
        
        session = await KBChatService.get_session(session_id)
        if not session:
            return False
        
        session.satisfaction_rating = max(1, min(5, rating))
        await session.save()
        return True
    
    @staticmethod
    async def convert_to_ticket(session_id: str, ticket_data: Dict[str, Any]) -> Optional[str]:
        """Convert a chat session to a support ticket"""
        
        session = await KBChatService.get_session(session_id)
        if not session:
            return None
        
        try:
            # Import here to avoid circular dependency
            from src.services.ticket_service import TicketService
            
            # Get chat history for ticket description
            messages = await session.get_messages()
            messages.reverse()
            
            # Format chat history
            chat_summary = "Chat conversation:\n\n"
            for msg in messages:
                role = "User" if msg.message_type == "user" else "Assistant"
                chat_summary += f"{role}: {msg.message}\n\n"
            
            # Create ticket
            ticket_data.update({
                "description": f"{ticket_data.get('description', '')}\n\n{chat_summary}",
                "tags": session.topics_discussed[:5]  # Use chat topics as tags
            })
            
            ticket = await TicketService.create_ticket(ticket_data)
            
            # Mark session as converted
            await session.mark_converted_to_ticket(str(ticket.id))
            
            return str(ticket.id)
            
        except Exception as e:
            logger.error(f"Failed to convert chat to ticket: {e}")
            return None
    
    @staticmethod
    async def delete_session(session_id: str) -> bool:
        """Delete a chat session and its messages"""
        
        try:
            session = await KBChatService.get_session(session_id)
            if not session:
                return False
            
            # Delete all messages in the session
            await ChatMessage.find(ChatMessage.session_id == session_id).delete()
            
            # Delete the session
            await session.delete()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete session {session_id}: {e}")
            return False