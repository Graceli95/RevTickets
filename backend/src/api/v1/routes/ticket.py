from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from beanie import PydanticObjectId
from src.models.user import User
from src.models.enums import TicketStatus
from src.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse
from src.schemas.comment import CommentCreate, CommentResponse
from src.services.ticket_service import TicketService
from src.services.comment_service import CommentService
from src.utils.security import get_current_user, get_current_agent_user
from pydantic import BaseModel

router = APIRouter(prefix="/tickets", tags=["Tickets"], dependencies=[Depends(get_current_user)])

# Request models
class AssignTicketRequest(BaseModel):
    agent_id: str

class UpdateStatusRequest(BaseModel):
    status: TicketStatus

class CloseTicketRequest(BaseModel):
    resolution_comment: str = None

@router.post("/", response_model=TicketResponse)
async def create_ticket(ticket_data: TicketCreate, current_user: User = Depends(get_current_user)):
    print(f"POST /tickets - Creating ticket for user: {current_user.email}")
    print(f"POST /tickets - Ticket data: {ticket_data}")
    try:
        result = await TicketService.create_ticket(ticket_data, current_user)
        print(f"POST /tickets - Successfully created ticket with ID: {result.id}")
        return result
    except Exception as e:
        print(f"POST /tickets - Error creating ticket: {e}")
        raise

@router.get("/", response_model=List[TicketResponse])
async def get_all_tickets(
    status: str = None,
    priority: str = None,
    current_user: User = Depends(get_current_user)
):
    print(f"GET /tickets - Fetching tickets for user: {current_user.email} (role: {current_user.role})")
    print(f"GET /tickets - Filters: status={status}, priority={priority}")
    
    # Build filters dict
    filters = {}
    if status:
        filters['status'] = status
    if priority:
        filters['priority'] = priority
    
    tickets = await TicketService.get_all_tickets(current_user, filters)
    print(f"GET /tickets - Returning {len(tickets)} tickets for {current_user.email}")
    return tickets

@router.get("/stats")
async def get_ticket_stats(current_user: User = Depends(get_current_user)):
    """Get ticket statistics"""
    return await TicketService.get_ticket_stats(current_user)

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: PydanticObjectId, current_user: User = Depends(get_current_user)):
    # Check access permissions
    if not await TicketService.can_access_ticket(ticket_id, current_user):
        raise HTTPException(status_code=403, detail="Access denied")
    
    ticket = await TicketService.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.put("/{ticket_id}", response_model=TicketResponse)
async def update_ticket(ticket_id: PydanticObjectId, ticket_data: TicketUpdate):
    ticket = await TicketService.update_ticket(ticket_id, ticket_data)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket

@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(ticket_id: PydanticObjectId):
    if not await TicketService.delete_ticket(ticket_id):
        raise HTTPException(status_code=404, detail="Ticket not found")

@router.get("/user/", response_model=List[TicketResponse])
async def get_tickets_by_user(current_user: User = Depends(get_current_user)):
    return await TicketService.get_tickets_by_user(current_user=current_user)

# Queue management endpoints for agents
@router.get("/queue/", response_model=List[TicketResponse])
async def get_queue_tickets(current_user: User = Depends(get_current_agent_user)):
    """Get unassigned tickets in agent's skill categories"""
    return await TicketService.get_queue_tickets(current_user)

@router.get("/assigned/", response_model=List[TicketResponse])
async def get_my_assigned_tickets(current_user: User = Depends(get_current_agent_user)):
    """Get tickets assigned to the current agent"""
    return await TicketService.get_my_assigned_tickets(current_user)

# Assignment endpoints
@router.post("/{ticket_id}/assign", response_model=TicketResponse)
async def assign_ticket(ticket_id: PydanticObjectId, request: AssignTicketRequest, current_user: User = Depends(get_current_agent_user)):
    return await TicketService.assign_ticket(ticket_id, request.agent_id)

@router.post("/{ticket_id}/auto-assign", response_model=TicketResponse)
async def auto_assign_ticket(ticket_id: PydanticObjectId, current_user: User = Depends(get_current_agent_user)):
    return await TicketService.auto_assign_ticket(ticket_id)

# Status management endpoints
@router.patch("/{ticket_id}/status", response_model=TicketResponse)
async def update_ticket_status(ticket_id: PydanticObjectId, request: UpdateStatusRequest):
    return await TicketService.update_ticket_status(ticket_id, request.status)

@router.post("/{ticket_id}/close", response_model=TicketResponse)
async def close_ticket(ticket_id: PydanticObjectId, request: CloseTicketRequest = None):
    resolution_comment = request.resolution_comment if request else None
    return await TicketService.close_ticket(ticket_id, resolution_comment)

@router.post("/{ticket_id}/resolve", response_model=TicketResponse)
async def resolve_ticket(ticket_id: PydanticObjectId, request: CloseTicketRequest = None):
    resolution_comment = request.resolution_comment if request else None
    return await TicketService.resolve_ticket(ticket_id, resolution_comment)

@router.post("/{ticket_id}/reopen", response_model=TicketResponse)
async def reopen_ticket(ticket_id: PydanticObjectId):
    return await TicketService.reopen_ticket(ticket_id)

@router.get("/{ticket_id}/can-reopen")
async def can_reopen_ticket(ticket_id: PydanticObjectId):
    can_reopen = await TicketService.can_reopen_ticket(ticket_id)
    return {"can_reopen": can_reopen}

# Comment routes within ticket context
@router.get("/{ticket_id}/comments", response_model=List[CommentResponse])
async def get_ticket_comments(ticket_id: PydanticObjectId):
    """Get all comments for a specific ticket"""
    return await CommentService.get_comments_by_ticket(str(ticket_id))

@router.post("/{ticket_id}/comments", response_model=CommentResponse)
async def create_ticket_comment(ticket_id: PydanticObjectId, comment_data: CommentCreate, current_user: User = Depends(get_current_user)):
    """Create a new comment for a specific ticket"""
    return await CommentService.create_comment(comment_data, ticket_id, current_user)





