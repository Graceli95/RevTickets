from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from beanie import PydanticObjectId
from src.models.user import User
from src.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse
from src.services.ticket_service import TicketService
from src.utils.security import get_current_user

router = APIRouter(prefix="/tickets", tags=["Tickets"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=TicketResponse)
async def create_ticket(ticket_data: TicketCreate):
    return await TicketService.create_ticket(ticket_data)

@router.get("/", response_model=List[TicketResponse])
async def get_all_tickets():
    return await TicketService.get_all_tickets()

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket(ticket_id: PydanticObjectId):
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


