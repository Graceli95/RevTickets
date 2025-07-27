from src.models.ticket import Ticket
from src.models.tag import Tag
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.user import User
from src.models.agent_info import AgentInfo
from src.models.enums import TicketStatus
from src.schemas.ticket import TicketCreate, TicketUpdate, TicketResponse, UserInfo
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse
from beanie import PydanticObjectId, Link
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException


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
    async def create_ticket(data: TicketCreate, current_user: User) -> TicketResponse:
        # Get category and subcategory
        category = await Category.get(data.category_id)
        if not category:
            raise HTTPException(status_code=400, detail="Invalid category")
        
        subcategory = await SubCategory.get(data.sub_category_id)
        if not subcategory:
            raise HTTPException(status_code=400, detail="Invalid subcategory")
        
        # Handle tags if provided
        tag_ids = []
        if data.tag_ids:
            for tag_data in data.tag_ids:
                tag_doc = Tag(**tag_data)
                await tag_doc.insert()
                tag_ids.append({"id": str(tag_doc.id)})

        # Create ticket with 'new' status and no agent assignment initially
        ticket = Ticket(
            categoryId=category,
            subCategoryId=subcategory,
            userId=current_user,
            agentId=None,
            title=data.title,
            description=data.description,
            content=data.content,
            status=TicketStatus.new,
            priority=data.priority,
            severity=data.severity,
            tagIds=tag_ids
        )
        
        ticket = await ticket.insert()
        return await TicketService._build_ticket_response(ticket)
    @staticmethod
    async def get_all_tickets(current_user: User) -> List[TicketResponse]:
        """Get tickets based on user role and permissions"""
        if current_user.role == "user":
            # Users only see their own tickets
            tickets = await Ticket.find(Ticket.userId.id == current_user.id).to_list()
        elif current_user.role == "agent":
            # Agents see tickets assigned to them OR in their skill categories that are unassigned
            agent_info = await AgentInfo.find_one(AgentInfo.user.id == current_user.id)
            if agent_info:
                await agent_info.fetch_link(AgentInfo.category)
            
            if agent_info and agent_info.category:
                # Get tickets assigned to this agent OR unassigned tickets in their category
                tickets = await Ticket.find({
                    "$or": [
                        {"agentId.$id": current_user.id},  # Assigned to this agent
                        {
                            "agentId": None,  # Unassigned tickets
                            "categoryId.$id": str(agent_info.category.id)  # In agent's category
                        }
                    ]
                }).to_list()
            else:
                # Agent with no skills can only see assigned tickets
                tickets = await Ticket.find(Ticket.agentId.id == current_user.id).to_list()
        else:
            # Unknown role
            tickets = []
        
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
            ticket.updatedAt = datetime.now(timezone.utc)
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

    @staticmethod
    async def assign_ticket(ticket_id: PydanticObjectId, agent_id: str) -> Optional[TicketResponse]:
        """Assign a ticket to a specific agent"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        agent = await User.get(agent_id)
        if not agent or agent.role != "agent":
            raise HTTPException(status_code=400, detail="Invalid agent")
        
        # Update ticket
        ticket.agentId = agent
        ticket.status = TicketStatus.in_progress
        ticket.updatedAt = datetime.now(timezone.utc)
        
        await ticket.save()
        return await TicketService._build_ticket_response(ticket)

    @staticmethod
    async def auto_assign_ticket(ticket_id: PydanticObjectId) -> Optional[TicketResponse]:
        """Automatically assign ticket to an agent based on category skills"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        if not ticket.categoryId:
            raise HTTPException(status_code=400, detail="Ticket must have a category for auto-assignment")
        
        # Find agents with matching category skills
        category = await ticket.categoryId.fetch()
        qualified_agents = await AgentInfo.find(AgentInfo.category.id == str(category.id)).to_list()
        
        if not qualified_agents:
            raise HTTPException(status_code=400, detail="No qualified agents found for this category")
        
        # Simple round-robin assignment: find agent with least active tickets
        best_agent = None
        min_active_tickets = float('inf')
        
        for agent_info in qualified_agents:
            agent = await agent_info.user.fetch()
            active_tickets = await Ticket.find(
                Ticket.agentId.id == agent.id,
                Ticket.status.in_([TicketStatus.new, TicketStatus.in_progress, TicketStatus.waiting_for_customer])
            ).count()
            
            if active_tickets < min_active_tickets:
                min_active_tickets = active_tickets
                best_agent = agent
        
        if best_agent:
            return await TicketService.assign_ticket(ticket_id, str(best_agent.id))
        else:
            raise HTTPException(status_code=400, detail="No available agents found")

    @staticmethod
    async def update_ticket_status(ticket_id: PydanticObjectId, new_status: TicketStatus) -> Optional[TicketResponse]:
        """Update ticket status with proper state management"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Validate state transitions
        valid_transitions = {
            TicketStatus.new: [TicketStatus.in_progress, TicketStatus.waiting_for_agent],
            TicketStatus.in_progress: [TicketStatus.waiting_for_customer, TicketStatus.resolved, TicketStatus.closed],
            TicketStatus.waiting_for_customer: [TicketStatus.in_progress, TicketStatus.closed],
            TicketStatus.waiting_for_agent: [TicketStatus.in_progress],
            TicketStatus.resolved: [TicketStatus.closed, TicketStatus.in_progress],  # Allow reopening from resolved
            TicketStatus.closed: [TicketStatus.in_progress]  # Allow reopening from closed
        }
        
        if new_status not in valid_transitions.get(ticket.status, []):
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid status transition from {ticket.status} to {new_status}"
            )
        
        # Update ticket
        ticket.status = new_status
        ticket.updatedAt = datetime.now(timezone.utc)
        
        # Set closedAt timestamp for closed/resolved states
        if new_status in [TicketStatus.closed, TicketStatus.resolved]:
            ticket.closedAt = datetime.now(timezone.utc)
        elif ticket.closedAt:  # Clear closedAt if reopening
            ticket.closedAt = None
        
        await ticket.save()
        return await TicketService._build_ticket_response(ticket)

    @staticmethod
    async def close_ticket(ticket_id: PydanticObjectId, resolution_comment: str = None) -> Optional[TicketResponse]:
        """Close a ticket with optional resolution comment"""
        return await TicketService.update_ticket_status(ticket_id, TicketStatus.closed)

    @staticmethod
    async def resolve_ticket(ticket_id: PydanticObjectId, resolution_comment: str = None) -> Optional[TicketResponse]:
        """Mark a ticket as resolved with optional resolution comment"""
        return await TicketService.update_ticket_status(ticket_id, TicketStatus.resolved)

    @staticmethod
    def _calculate_business_days(start_date: datetime, end_date: datetime) -> int:
        """Calculate business days between two dates (excluding weekends)"""
        business_days = 0
        current_date = start_date.date()
        end_date = end_date.date()
        
        while current_date <= end_date:
            if current_date.weekday() < 5:  # Monday = 0, Sunday = 6
                business_days += 1
            current_date += timedelta(days=1)
        
        return business_days

    @staticmethod
    async def can_reopen_ticket(ticket_id: PydanticObjectId) -> bool:
        """Check if a ticket can be reopened (within 10 business days)"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            return False
        
        if ticket.status not in [TicketStatus.closed, TicketStatus.resolved]:
            return False
        
        if not ticket.closedAt:
            return False
        
        now = datetime.now(timezone.utc)
        business_days = TicketService._calculate_business_days(ticket.closedAt, now)
        
        return business_days <= 10

    @staticmethod
    async def reopen_ticket(ticket_id: PydanticObjectId) -> Optional[TicketResponse]:
        """Reopen a closed/resolved ticket if within 10 business days"""
        if not await TicketService.can_reopen_ticket(ticket_id):
            raise HTTPException(
                status_code=400, 
                detail="Ticket cannot be reopened. Either it's not closed/resolved or more than 10 business days have passed."
            )
        
        return await TicketService.update_ticket_status(ticket_id, TicketStatus.in_progress)

    @staticmethod
    async def get_queue_tickets(current_user: User) -> List[TicketResponse]:
        """Get unassigned tickets in agent's skill categories (queue view)"""
        if current_user.role != "agent":
            raise HTTPException(status_code=403, detail="Only agents can access the queue")
        
        agent_info = await AgentInfo.find_one(AgentInfo.user.id == current_user.id)
        if not agent_info or not agent_info.category:
            return []  # Agent has no skills, no queue access
        
        # Get unassigned tickets in agent's category
        tickets = await Ticket.find({
            "agentId": None,
            "categoryId.$id": agent_info.category.id,
            "status": {"$in": [TicketStatus.new, TicketStatus.waiting_for_agent]}
        }).to_list()
        
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod 
    async def get_my_assigned_tickets(current_user: User) -> List[TicketResponse]:
        """Get tickets assigned to the current agent"""
        if current_user.role != "agent":
            raise HTTPException(status_code=403, detail="Only agents can access assigned tickets")
        
        tickets = await Ticket.find(Ticket.agentId.id == current_user.id).to_list()
        return [await TicketService._build_ticket_response(t) for t in tickets]

    @staticmethod
    async def can_access_ticket(ticket_id: PydanticObjectId, current_user: User) -> bool:
        """Check if user can access a specific ticket"""
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            return False
        
        if current_user.role == "user":
            # Users can only access their own tickets
            return str(ticket.userId.id) == str(current_user.id)
        elif current_user.role == "agent":
            # Agents can access tickets assigned to them OR unassigned tickets in their category
            if ticket.agentId and str(ticket.agentId.id) == str(current_user.id):
                return True
            
            if not ticket.agentId:  # Unassigned ticket
                agent_info = await AgentInfo.find_one(AgentInfo.user.id == current_user.id)
                if agent_info and agent_info.category and str(ticket.categoryId.id) == str(agent_info.category.id):
                    return True
        
        return False

    @staticmethod
    async def get_ticket_stats(current_user: User) -> dict:
        """Get ticket statistics based on user role"""
        if current_user.role == "user":
            # Users only see stats for their own tickets
            tickets = await Ticket.find(Ticket.userId.id == current_user.id).to_list()
        elif current_user.role == "agent":
            # Agents see stats for tickets they can access (assigned + queue)
            agent_info = await AgentInfo.find_one(AgentInfo.user.id == current_user.id)
            if agent_info:
                await agent_info.fetch_link(AgentInfo.category)
            
            if agent_info and agent_info.category:
                tickets = await Ticket.find({
                    "$or": [
                        {"agentId.$id": current_user.id},  # Assigned to this agent
                        {
                            "agentId": None,  # Unassigned tickets
                            "categoryId.$id": str(agent_info.category.id)  # In agent's category
                        }
                    ]
                }).to_list()
            else:
                tickets = await Ticket.find(Ticket.agentId.id == current_user.id).to_list()
        else:
            tickets = []

        # Count by status
        stats = {
            "total": len(tickets),
            "new": 0,
            "in_progress": 0,
            "waiting_for_customer": 0,
            "waiting_for_agent": 0,
            "resolved": 0,
            "closed": 0,
            "by_priority": {
                "low": 0,
                "medium": 0,
                "high": 0,
                "critical": 0
            },
            "by_severity": {
                "low": 0,
                "medium": 0,
                "high": 0,
                "critical": 0
            }
        }

        for ticket in tickets:
            # Count by status
            if ticket.status == TicketStatus.new:
                stats["new"] += 1
            elif ticket.status == TicketStatus.in_progress:
                stats["in_progress"] += 1
            elif ticket.status == TicketStatus.waiting_for_customer:
                stats["waiting_for_customer"] += 1
            elif ticket.status == TicketStatus.waiting_for_agent:
                stats["waiting_for_agent"] += 1
            elif ticket.status == TicketStatus.resolved:
                stats["resolved"] += 1
            elif ticket.status == TicketStatus.closed:
                stats["closed"] += 1

            # Count by priority
            stats["by_priority"][ticket.priority.value] += 1
            
            # Count by severity  
            stats["by_severity"][ticket.severity.value] += 1

        return stats

