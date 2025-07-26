from fastapi import APIRouter, HTTPException
from src.schemas.category import CategoryCreate, CategoryResponse, CategoryUpdate
from src.services.category_service import CategoryService
from typing import List
from beanie import PydanticObjectId
from src.schemas.subcategory import SubCategoryResponse
from src.utils.security import get_current_user
from fastapi import APIRouter, Depends


router = APIRouter(prefix="/categories", tags=["Categories"], dependencies=[Depends(get_current_user)] )

@router.post("/", response_model=CategoryResponse)
async def create_category(category: CategoryCreate):
    return await CategoryService.create_category(category)

@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: str):
    category = await CategoryService.get_category(category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: str, category: CategoryUpdate):
    updated = await CategoryService.update_category(category_id, category)
    if not updated:
        raise HTTPException(status_code=404, detail="Category not found")
    return updated

@router.delete("/{category_id}")
async def delete_category(category_id: str):
    await CategoryService.delete_category(category_id)
    return {"status": "deleted"}

@router.get("/", response_model=List[CategoryResponse])
async def get_all_categories():
    return await CategoryService.get_all_categories()

@router.get("/{category_id}/subcategories", response_model=List[SubCategoryResponse])
async def get_subcategories_by_category(category_id: str):
    return await CategoryService.get_subcategories_by_category(category_id)

