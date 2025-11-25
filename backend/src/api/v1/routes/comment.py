from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from src.services.comment_service import CommentService
from src.utils.security import get_current_user
from src.schemas.comment import CommentCreate, CommentResponse, CommentUpdate

router = APIRouter(prefix="/comments", tags=["Comments"], dependencies=[Depends(get_current_user)] )

@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(comment: CommentCreate):
    try:
        return await CommentService.create_comment(comment)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(comment_id: str):
    comment = await CommentService.get_comment(comment_id)
    if comment:
        return comment
    raise HTTPException(status_code=404, detail="Comment not found")

@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(comment_id: str):
    await CommentService.delete_comment(comment_id)
    return

@router.get("/user/{user_id}", response_model=List[CommentResponse])
async def get_comments_by_user(user_id: str):
    return await CommentService.get_comments_by_user(user_id)

@router.get("/ticket/{ticket_id}", response_model=List[CommentResponse])
async def get_comments_by_ticket(ticket_id: str):
    return await CommentService.get_comments_by_ticket(ticket_id)


# feature edit comment
@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(comment_id: str, comment: CommentUpdate):
    updated_comment = await CommentService.update_comment(comment_id, comment)
    if updated_comment:
        return updated_comment
    raise HTTPException(status_code=404, detail="Comment not found")
