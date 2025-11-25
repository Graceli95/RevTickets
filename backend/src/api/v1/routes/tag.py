from fastapi import APIRouter, HTTPException, Depends
from src.schemas.tag import TagCreate, TagResponse, TagUpdate
from src.services.tag_service import TagService
from src.utils.security import get_current_user
from typing import List


router = APIRouter(prefix="/tags", tags=["Tags"], dependencies=[Depends(get_current_user)])

@router.post("/", response_model=TagResponse)
async def create_tag(tag: TagCreate):
    return await TagService.create_tag(tag)

@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: str):
    tag = await TagService.get_tag(tag_id)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag

@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: str, tag: TagUpdate):
    updated = await TagService.update_tag(tag_id, tag)
    if not updated:
        raise HTTPException(status_code=404, detail="Tag not found")
    return updated

@router.delete("/{tag_id}")
async def delete_tag(tag_id: str):
    await TagService.delete_tag(tag_id)
    return {"status": "deleted"}

@router.get("/", response_model=List[TagResponse])
async def get_all_tags():
    return await TagService.get_all_tags()