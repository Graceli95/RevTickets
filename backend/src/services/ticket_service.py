from src.models.ticket import Ticket
from src.models.tag import Tag
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.user import User
from src.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse, UserInfo
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse
from beanie import PydanticObjectId, Link
from typing import List, Optional
from datetime import datetime


class TicketService:
    @staticmethod
    async def _build_ticket_response(ticket: Ticket) -> TicketResponse:
        # Fetch linked category and subcategory
        category = await ticket.categoryId.fetch() if ticket.categoryId else None
        subcategory = await ticket.subCategoryId.fetch() if ticket.subCategoryId else None
        user = await ticket.userId.fetch() if ticket.userId else None
        agent = await ticket.agentId.fetch() if ticket.agentId else None

        if category:
            category.id = str(category.id)
        if subcategory:
            subcategory.id = str(subcategory.id)
        if user:
            user.id = str(user.id)
        if agent:
            agent.id = str(agent.id)
        category = CategoryResponse(**category.model_dump()) if category else None
        subcategory = SubCategoryResponse(**subcategory.model_dump()) if subcategory else None
        user = UserInfo(id=str(user.id), email=user.email, name=(user.first_name + " " + user.last_name)) if user else None
        agent = UserInfo(id=str(agent.id), email=agent.email, name=(agent.first_name + " " + agent.last_name)) if agent else None
        

        return TicketResponse(
            id=str(ticket.id),
            status=ticket.status,
            userInfo=user,
            agentInfo=agent,
            title=ticket.title,
            description=ticket.description,
            content=ticket.content,
            priority=ticket.priority,
            severity=ticket.severity,
            createdAt=ticket.createdAt,
            updatedAt=ticket.updatedAt,
            closedAt=ticket.closedAt,
            category=category,
            subCategory=subcategory,
            tagIds=ticket.tagIds or [],
            )



    @staticmethod
    async def create_ticket(data: TicketCreate) -> TicketResponse:
        tag_ids = []
        if data.tagData:
            for tag in data.tagData:
                tag_doc = Tag(**tag.dict())
                await tag_doc.insert()
                tag_ids.append({"id": str(tag_doc.id)})

        ticket = Ticket(**data.dict(exclude={"tagData"}), tagIds=tag_ids)
        ticket = await ticket.insert()
        ticket.id = str(ticket.id)
        return await TicketService._build_ticket_response(ticket)
    @staticmethod
    async def get_all_tickets() -> List[TicketResponse]:
        tickets = await Ticket.find_all().to_list()
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod
    async def get_ticket(ticket_id: PydanticObjectId) -> Optional[TicketResponse]:
        ticket = await Ticket.get(ticket_id)
        if ticket:
            return await TicketService._build_ticket_response(ticket)
        return None

    @staticmethod
    async def update_ticket(ticket_id: PydanticObjectId, data: TicketUpdate) -> Optional[TicketResponse]:
        ticket = await Ticket.get(ticket_id)
        if ticket:
            ticket.updatedAt = datetime.utcnow()
            updated_ticket = await ticket.set(data.dict(exclude_unset=True))
            updated_ticket.id = str(updated_ticket.id)
            return await TicketService._build_ticket_response(updated_ticket)
        return None

    @staticmethod
    async def delete_ticket(ticket_id: PydanticObjectId) -> bool:
        ticket = await Ticket.get(ticket_id)
        if ticket:
            await ticket.delete()
            return True
        return False

    @staticmethod
    async def get_tickets_by_user(current_user: User) -> List[TicketResponse]:
        if current_user.role == "user":
            tickets = await Ticket.find(Ticket.userId.id == current_user.id).to_list()
        elif current_user.role == "agent":
            tickets = await Ticket.find(Ticket.agentId.id == current_user.id).to_list()
        else:
            return []  # or raise HTTPException(status_code=403, detail="Role not supported")
    
        return [await TicketService._build_ticket_response(t) for t in tickets]

