from beanie import PydanticObjectId
from typing import List, Optional
from src.models.comment import Comment
from src.models.ticket import Ticket
from src.models.user import User
from src.models.enums import TicketStatus
from src.schemas.comment import CommentCreate, CommentResponse, CommentUpdate, UserInfo
from datetime import datetime, timezone

class CommentService:
    @staticmethod
    async def _to_comment_response(comment: Comment) -> CommentResponse:
        # Handle ticket Link
        if hasattr(comment.ticket, 'fetch'):
            ticket = await comment.ticket.fetch()
        else:
            ticket = comment.ticket
        
        # Handle user_id Link properly and include role information
        user = None
        if hasattr(comment.user_id, 'fetch'):
            user = await comment.user_id.fetch()
        else:
            user = comment.user_id
            
        user_info = None
        if user:
            user_info = UserInfo(
                id=str(user.id),
                email=user.email,
                name=(user.first_name + " " + user.last_name) if user.first_name and user.last_name else user.email,
                role=user.role  # Include role to show if user is agent or regular user
            )
        
        # Build response directly like TicketResponse does, passing content object directly
        return CommentResponse(
            id=str(comment.id),
            content=comment.content,  # Pass RichTextContent object directly
            ticket_id=str(ticket.id) if ticket else None,
            user=user_info,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )

    @staticmethod
    async def create_comment(comment_data: CommentCreate, ticket_id: PydanticObjectId, current_user: User) -> CommentResponse:
        # Get the ticket
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise ValueError("Invalid ticket ID")

        # ENHANCEMENT L2 SLA AUTOMATION - Check if we need to update ticket status and trigger SLA logic
        status_changed = False
        
        # ENHANCEMENT L2 SLA AUTOMATION - Handle status changes and SLA logic directly
        old_status = ticket.status
        new_status = None
        
        # If a regular user (non-agent) responds to a ticket that's waiting for customer response,
        # change status to waiting_for_agent (this will resume SLA timer)
        if (current_user.role == "user" and 
            ticket.status == TicketStatus.waiting_for_customer):
            print(f"User {current_user.email} responding to ticket {ticket_id}, changing status from waiting_for_customer to waiting_for_agent")
            new_status = TicketStatus.waiting_for_agent
            ticket.status = new_status
            ticket.updated_at = datetime.utcnow()  # Use naive UTC datetime
            status_changed = True
            
        # If an agent responds to a ticket that's waiting for agent response,
        # change status to waiting_for_customer (this will pause SLA timer)
        elif (current_user.role == "agent" and 
              ticket.status == TicketStatus.waiting_for_agent):
            print(f"Agent {current_user.email} responding to ticket {ticket_id}, changing status from waiting_for_agent to waiting_for_customer")
            new_status = TicketStatus.waiting_for_customer
            ticket.status = new_status
            ticket.updated_at = datetime.utcnow()  # Use naive UTC datetime
            status_changed = True
            
        # Save ticket with new status
        if status_changed:
            await ticket.save()
            
            # ENHANCEMENT L2 SLA AUTOMATION - Handle SLA pause/resume logic
            try:
                from src.services.sla_service import SLAService
                if new_status == TicketStatus.waiting_for_customer and old_status != TicketStatus.waiting_for_customer:
                    # Agent responded, pause SLA timer
                    await SLAService.pause_sla(ticket)
                    print(f"SLA paused for ticket {ticket.id}: agent responded")
                elif old_status == TicketStatus.waiting_for_customer and new_status != TicketStatus.waiting_for_customer:
                    # Customer responded, resume SLA timer and extend due date
                    await SLAService.resume_sla(ticket)
                    print(f"SLA resumed for ticket {ticket.id}: customer responded, due date extended")
            except Exception as e:
                print(f"SLA pause/resume failed for ticket {ticket.id}: {e}")
                # Don't fail comment creation if SLA logic fails

        # Create comment with automatically set fields
        comment = Comment(
            content=comment_data.content,
            user_id=current_user,  # Use current_user directly
            ticket=ticket,
            created_at=datetime.utcnow(),  # Use naive UTC datetime
            updated_at=datetime.utcnow()   # Use naive UTC datetime
        )
        
        comment = await comment.insert()
        return await CommentService._to_comment_response(comment)

    @staticmethod
    async def get_comment(comment_id: str) -> Optional[CommentResponse]:
        comment = await Comment.get(PydanticObjectId(comment_id))
        if comment:
            return await CommentService._to_comment_response(comment)
        return None

    @staticmethod
    async def delete_comment(comment_id: str):
        comment = await Comment.get(PydanticObjectId(comment_id))
        if comment:
            await comment.delete()

    @staticmethod
    async def get_comments_by_user(user_id: str) -> List[CommentResponse]:
        # Get all comments and filter in Python to handle Link objects
        all_comments = await Comment.find_all().to_list()
        result = []
        
        for comment in all_comments:
            # Check if this comment belongs to the user
            comment_user_id = None
            if hasattr(comment.user_id, 'id'):
                comment_user_id = str(comment.user_id.id)
            elif hasattr(comment.user_id, 'ref') and comment.user_id.ref:
                comment_user_id = str(comment.user_id.ref.id)
            
            if comment_user_id == user_id:
                result.append(await CommentService._to_comment_response(comment))
        
        return result

    @staticmethod
    async def get_comments_by_ticket(ticket_id: str) -> List[CommentResponse]:
        # Get all comments and filter in Python to handle Link objects
        all_comments = await Comment.find_all().to_list()
        result = []
        
        for comment in all_comments:
            # Check if this comment belongs to the ticket
            comment_ticket_id = None
            if hasattr(comment.ticket, 'id'):
                comment_ticket_id = str(comment.ticket.id)
            elif hasattr(comment.ticket, 'ref') and comment.ticket.ref:
                comment_ticket_id = str(comment.ticket.ref.id)
            
            if comment_ticket_id == ticket_id:
                result.append(await CommentService._to_comment_response(comment))
        
        return result
    

    # feature update/edit comment
    @staticmethod
    async def update_comment(comment_id: str, comment_data: CommentUpdate) -> Optional[CommentResponse]:
        comment = await Comment.get(PydanticObjectId(comment_id))
        if not comment:
            return None
        
        # Update fields
        comment.content = comment_data.content or comment.content
        comment.updated_at = datetime.now(timezone.utc)
        
        # Save changes
        comment = await comment.save()
        return await CommentService._to_comment_response(comment)
    
