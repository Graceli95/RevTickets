from beanie import PydanticObjectId
from typing import List, Optional
from src.models.comment import Comment, CommentEditHistory
from src.models.ticket import Ticket
from src.models.user import User
from src.models.enums import TicketStatus
from src.schemas.comment import CommentCreate, CommentResponse, CommentUpdate, UserInfo, CommentEditHistoryResponse
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException

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
        
        # Convert edit history to response format
        edit_history_response = [
            CommentEditHistoryResponse(
                edited_at=edit.edited_at,
                previous_content=edit.previous_content
            )
            for edit in (comment.edit_history or [])
        ]
        
        # Build response directly like TicketResponse does, passing content object directly
        return CommentResponse(
            id=str(comment.id),
            content=comment.content,  # Pass RichTextContent object directly
            ticket_id=str(ticket.id) if ticket else None,
            user=user_info,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            edited=comment.edited if hasattr(comment, 'edited') else False,
            edit_count=comment.edit_count if hasattr(comment, 'edit_count') else 0,
            edit_history=edit_history_response
        )

    @staticmethod
    async def create_comment(comment_data: CommentCreate, ticket_id: PydanticObjectId, current_user: User) -> CommentResponse:
        # Get the ticket
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            raise ValueError("Invalid ticket ID")

        # Check if we need to update ticket status
        # If a regular user (non-agent) responds to a ticket that's waiting for customer response,
        # change status to waiting_for_agent
        if (current_user.role == "user" and 
            ticket.status == TicketStatus.waiting_for_customer):
            print(f"User {current_user.email} responding to ticket {ticket_id}, changing status from waiting_for_customer to waiting_for_agent")
            ticket.status = TicketStatus.waiting_for_agent
            ticket.updated_at = datetime.now(timezone.utc)
            await ticket.save()

        # Create comment with automatically set fields
        comment = Comment(
            content=comment_data.content,
            user_id=current_user,  # Use current_user directly
            ticket=ticket,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
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
    

    # ENHANCEMENT L1 COMMENT EDITING - Update comment with edit history tracking and validation
    @staticmethod
    async def update_comment(comment_id: str, comment_data: CommentUpdate, current_user: User) -> Optional[CommentResponse]:
        """
        Update a comment with edit history tracking and 24-hour time limit validation.
        
        Args:
            comment_id: The ID of the comment to update
            comment_data: The new comment data
            current_user: The user making the edit (for authorization)
            
        Returns:
            Updated comment response or None if not found
            
        Raises:
            HTTPException: If user is not authorized or 24-hour window has passed
        """
        comment = await Comment.get(PydanticObjectId(comment_id))
        if not comment:
            return None
        
        # Fetch the comment author for authorization check
        comment_user = await comment.user_id.fetch() if hasattr(comment.user_id, 'fetch') else comment.user_id
        
        # AUTHORIZATION: Only the comment author can edit their comment
        if str(comment_user.id) != str(current_user.id):
            raise HTTPException(
                status_code=403,
                detail="You can only edit your own comments"
            )
        
        # TIME LIMIT VALIDATION: Check if comment is within 24-hour edit window
        # Ensure created_at is timezone-aware for proper comparison
        created_at = comment.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)
        
        time_since_creation = datetime.now(timezone.utc) - created_at
        if time_since_creation > timedelta(hours=24):
            hours_passed = int(time_since_creation.total_seconds() / 3600)
            raise HTTPException(
                status_code=403,
                detail=f"Comments can only be edited within 24 hours of creation. This comment was created {hours_passed} hours ago."
            )
        
        # Store the previous content in edit history before updating
        if comment_data.content and comment_data.content != comment.content:
            edit_history_entry = CommentEditHistory(
                edited_at=datetime.now(timezone.utc),
                previous_content=comment.content
            )
            
            # Initialize edit_history if it doesn't exist (for backward compatibility)
            if not hasattr(comment, 'edit_history') or comment.edit_history is None:
                comment.edit_history = []
            
            comment.edit_history.append(edit_history_entry)
            
            # Update the content
            comment.content = comment_data.content
            
            # Update edit tracking fields
            comment.edited = True
            comment.edit_count = (comment.edit_count if hasattr(comment, 'edit_count') else 0) + 1
            comment.updated_at = datetime.now(timezone.utc)
        
        # Save changes
        comment = await comment.save()
        return await CommentService._to_comment_response(comment)
    
