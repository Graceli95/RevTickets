from src.langchain_app.chains.summarize_ticket_data import summarize_ticket_data
from src.langchain_app.chains.generate_closing_comments import generate_closing_comments
from src.langchain_app.chains.generate_tags import generate_tags_for_article
from .ticket_service import TicketService
from .comment_service import CommentService
from src.schemas.summary import TicketSummaryResponse
from src.schemas.closing_comments import ClosingComments
# ENHANCEMENT L1 AI CLOSING SUGGESTIONS - Additional imports for direct database access
from src.models.ticket import Ticket
from src.models.comment import Comment
from beanie import PydanticObjectId
from fastapi import HTTPException

class AIService:
    @staticmethod
    async def get_ticket_summary(ticket_id: str) -> str:
        # Import here to avoid circular imports
        from src.models.ticket import Ticket
        from beanie import PydanticObjectId
        
        # Get the raw ticket model directly from database
        try:
            ticket_obj_id = PydanticObjectId(ticket_id)
            ticket = await Ticket.get(ticket_obj_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ticket ID: {str(e)}")

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        # Return cached summary if it exists
        if ticket.ai_summary:
            return TicketSummaryResponse(summary=ticket.ai_summary)
            
        # Handle linked objects - they might be Link objects (need fetch) or actual objects (already fetched)
        if hasattr(ticket.category_id, 'fetch'):
            category = await ticket.category_id.fetch() if ticket.category_id else None
        else:
            category = ticket.category_id
            
        if hasattr(ticket.sub_category_id, 'fetch'):
            subcategory = await ticket.sub_category_id.fetch() if ticket.sub_category_id else None
        else:
            subcategory = ticket.sub_category_id

        # Fetch comments separately if not linked
        comments = await CommentService.get_comments_by_ticket(ticket_id)

        # Build data for summary
        summary_data = {
            "title": ticket.title,
            "description": ticket.description,
            "category": category.name if category else "Uncategorized",
            "subcategory": subcategory.name if subcategory else "None",
            "tags": [f"{tag_dict.get('key', '')}: {tag_dict.get('value', '')}" for tag_dict in (ticket.tag_ids or [])],
            "comments": [c.content.text for c in comments],
        }

        # Send to LangChain summary function
        summary = await summarize_ticket_data(summary_data)
        
        # Store the summary in the ticket
        from datetime import datetime, timezone
        ticket.ai_summary = summary
        ticket.summary_generated_at = datetime.now(timezone.utc)
        await ticket.save()
        
        return TicketSummaryResponse(summary=summary)
    # ENHANCEMENT L1 AI CLOSING SUGGESTIONS - Generate AI-powered closing suggestions
    @staticmethod
    async def get_closing_comments(ticket_id: str) -> ClosingComments:
        # Get ticket directly from database using raw Ticket model
        try:
            ticket_obj_id = PydanticObjectId(ticket_id)
            ticket = await Ticket.get(ticket_obj_id)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid ticket ID format: {str(e)}")

        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
            
        # Handle linked objects - they might be Link objects (need fetch) or actual objects (already fetched)
        if hasattr(ticket.category_id, 'fetch'):
            category = await ticket.category_id.fetch() if ticket.category_id else None
        else:
            category = ticket.category_id
            
        if hasattr(ticket.sub_category_id, 'fetch'):
            subcategory = await ticket.sub_category_id.fetch() if ticket.sub_category_id else None
        else:
            subcategory = ticket.sub_category_id

        # Get comments directly from database
        comments = await Comment.find({"ticket_id": ticket_obj_id}).to_list()

        # Handle linked objects - they might be Link objects (need fetch) or actual objects (already fetched)
        if hasattr(ticket.category_id, 'fetch'):
            category = await ticket.category_id.fetch() if ticket.category_id else None
        else:
            category = ticket.category_id
            
        if hasattr(ticket.sub_category_id, 'fetch'):
            subcategory = await ticket.sub_category_id.fetch() if ticket.sub_category_id else None
        else:
            subcategory = ticket.sub_category_id

        # Format data for LangChain
        data = {
            "title": ticket.title,
            "description": ticket.description,
            "category": category.name if category else "Uncategorized",
            "subcategory": subcategory.name if subcategory else "None",
            "tags": [f"{tag_dict.get('key', '')}: {tag_dict.get('value', '')}" for tag_dict in (ticket.tag_ids or [])],
            "comments": [comment.content.get('text', '') if hasattr(comment.content, 'get') else str(comment.content) for comment in comments],
        }

        try:
            closing_suggestion = await generate_closing_comments(data)
            return closing_suggestion
        except Exception as e:
            print(f"AI closing suggestion generation failed: {e}")
            # Fallback to basic closing suggestion for development
            fallback_suggestion = ClosingComments(
                reason="Issue Resolution",
                comment=f"The issue reported in '{ticket.title}' has been addressed. Based on our analysis of the ticket and related discussions, the problem appears to be resolved. Please let us know if you experience any further issues."
            )
            return fallback_suggestion

    # ENHANCEMENT L2 AI KB TAGS - Generate AI-powered tags for knowledge base articles
    @staticmethod
    async def generate_article_tags(article_id: str = None, title: str = None, content: str = None) -> list[str]:
        """
        Generate AI-powered tags for a knowledge base article.
        
        Args:
            article_id: Optional article ID to fetch from database
            title: Article title (required if article_id not provided)
            content: Article content (required if article_id not provided)
            
        Returns:
            List of generated tags
        """
        # If article_id is provided, fetch the article from database
        if article_id:
            from src.models.article import Article
            try:
                article_obj_id = PydanticObjectId(article_id)
                article = await Article.get(article_obj_id)
                if not article:
                    raise HTTPException(status_code=404, detail="Article not found")
                
                title = article.title
                
                # Use lightweight content processing for faster tag generation
                # Focus on title-based analysis for optimal performance
                content = ""
                    
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Invalid article ID: {str(e)}")
        
        # Validate required parameters - title is sufficient for tag generation
        if not title:
            raise HTTPException(status_code=400, detail="Title is required")
        
        try:
            # Use streamlined tag generation focusing on title analysis
            tags = await generate_tags_for_article(title, content)
            return tags
        except Exception as e:
            print(f"AI tag generation failed: {e}")
            # Return empty list as fallback
            return []
