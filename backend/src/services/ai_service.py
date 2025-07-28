from src.langchain_app.chains.summarize_ticket_data import summarize_ticket_data
from src.langchain_app.chains.generate_closing_comments import generate_closing_comments
from .ticket_service import TicketService
from .comment_service import CommentService
from src.schemas.summary import TicketSummaryResponse
from src.schemas.closing_comments import ClosingComments
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
    @staticmethod
    async def get_closing_comments(ticket_id: str) -> str:
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

        data = {
            "title": ticket.title,
            "description": ticket.description,
            "category": category.name if category else "Uncategorized",
            "subcategory": subcategory.name if subcategory else "None",
            "tags": [f"{tag_dict.get('key', '')}: {tag_dict.get('value', '')}" for tag_dict in (ticket.tag_ids or [])],
            "comments": [c.content.text for c in comments],
        }

        comment = await generate_closing_comments(data)
        return comment
