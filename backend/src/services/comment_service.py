from beanie import PydanticObjectId
from typing import List, Optional
from src.models.comment import Comment
from src.models.ticket import Ticket
from src.models.user import User
from src.schemas.comment import CommentCreate, CommentResponse, CommentUpdate, UserInfo
from datetime import datetime, timezone

class CommentService:
    @staticmethod
    async def _to_comment_response(comment: Comment) -> CommentResponse:
        comment_dict = comment.model_dump()
        comment_dict["id"] = str(comment.id)
        ticket = await comment.ticket.fetch()
        comment_dict["ticketId"] = str(ticket.id) if ticket else None
        user = await comment.user.fetch() if hasattr(comment, "user") else None
        if user:
            comment_dict["user"] = UserInfo(
                id=str(user.id),
                email=user.email,
                name=(user.first_name + " " + user.last_name)
            )
        return CommentResponse(**comment_dict)

    @staticmethod
    async def create_comment(comment_data: CommentCreate) -> CommentResponse:
        ticket = await Ticket.get(PydanticObjectId(comment_data.ticketId))
        user = await User.get(PydanticObjectId(comment_data.userId))

        if not ticket:
            raise ValueError("Invalid ticket ID")

        comment = Comment(
            content=comment_data.content,
            user=user,
            ticket=ticket,
            createdAt=comment_data.createdAt,
            updatedAt=comment_data.updatedAt
        )
        user_info = UserInfo(id=str(user.id), email=user.email, name=(user.first_name + " " + user.last_name)) if user else None
        comment = await comment.insert()
        comment_dict = comment.model_dump()
        comment_dict["user"] = user_info
        comment_dict["id"] = str(comment.id)
        comment_dict["ticketId"] = str(ticket.id)
        return CommentResponse(**comment_dict)

    @staticmethod
    async def get_comment(comment_id: str) -> Optional[CommentResponse]:
        comment = await Comment.get(PydanticObjectId(comment_id))
        if comment:
            comment_dict = comment.model_dump()
            comment_dict["id"] = str(comment.id)
            ticket = await comment.ticket.fetch()
            comment_dict["ticketId"] = str(ticket.id) if ticket else None
            return CommentResponse(**comment_dict)
        return None

    @staticmethod
    async def delete_comment(comment_id: str):
        comment = await Comment.get(PydanticObjectId(comment_id))
        if comment:
            await comment.delete()

    @staticmethod
    async def get_comments_by_user(user_id: str) -> List[CommentResponse]:
        comments = await Comment.find(Comment.userId == user_id).to_list()
        result = []
        for c in comments:
            comment_dict = c.model_dump()
            comment_dict["id"] = str(c.id)
            ticket = await c.ticket.fetch()
            comment_dict["ticketId"] = str(ticket.id) if ticket else None
            result.append(CommentResponse(**comment_dict))
        return result

    @staticmethod
    async def get_comments_by_ticket(ticket_id: str) -> List[CommentResponse]:
        comments = await Comment.find(Comment.ticket.id == PydanticObjectId(ticket_id)).to_list()
        result = []
        for c in comments:
            comment_dict = c.model_dump()
            comment_dict["id"] = str(c.id)
            ticket = await c.ticket.fetch()
            comment_dict["ticketId"] = str(ticket.id) if ticket else None            
            result.append(CommentResponse(**comment_dict))
        return result
    

    # feature update/edit comment
    @staticmethod
    async def update_comment(comment_id: str, comment_data: CommentUpdate) -> Optional[CommentResponse]:
        comment = await Comment.get(PydanticObjectId(comment_id))
        if not comment:
            return None
        
        # Update fields
        comment.content = comment_data.content or comment.content
        comment.updatedAt = datetime.now(timezone.utc)
        
        # Save changes
        comment = await comment.save()
        comment_dict = comment.model_dump()
        comment_dict["id"] = str(comment.id)
        ticket = await comment.ticket.fetch()
        comment_dict["ticketId"] = str(ticket.id) if ticket else None
        return CommentResponse(**comment_dict)
    
