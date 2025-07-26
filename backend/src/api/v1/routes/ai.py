from src.services.ai_service import AIService
from src.schemas.summary import TicketSummaryResponse
from src.schemas.closing_comments import ClosingComments
from src.utils.security import get_current_agent_user
from fastapi import APIRouter, Depends, HTTPException


router = APIRouter(prefix="/tickets", tags=["Tickets"], dependencies=[Depends(get_current_agent_user)])



@router.get("/{ticket_id}/summary", response_model=TicketSummaryResponse)
async def summarize_ticket(ticket_id: str):
    try:
        summary = await AIService.get_ticket_summary(ticket_id)
        return summary
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
@router.get("/{ticket_id}/closing_comments", response_model=ClosingComments)
async def summarize_ticket(ticket_id: str):
    try:
        summary = await AIService.get_closing_comments(ticket_id)
        return summary
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

