from fastapi import APIRouter, HTTPException, Depends
from src.schemas.subcategory import SubCategoryCreate, SubCategoryUpdate, SubCategoryResponse
from src.services.subcategory_service import SubCategoryService
from src.utils.security import get_current_user
from typing import List

router = APIRouter(prefix="/subcategories", tags=["SubCategories"], dependencies=[Depends(get_current_user)])

@router.get("/", response_model=List[SubCategoryResponse])
async def get_all_subcategories():
    print("GET /subcategories - Fetching all subcategories")
    subcategories = await SubCategoryService.get_all_subcategories()
    print(f"GET /subcategories - Returning {len(subcategories)} subcategories")
    return subcategories

@router.post("/", response_model=SubCategoryResponse)
async def create_subcategory(subcategory: SubCategoryCreate):
    print(f"POST /subcategories - Creating subcategory: {subcategory.name} for category: {subcategory.category_id}")
    result = await SubCategoryService.create_subcategory(subcategory)
    print(f"POST /subcategories - Created subcategory with ID: {result.id}")
    return result

@router.get("/{subcategory_id}", response_model=SubCategoryResponse)
async def get_subcategory(subcategory_id: str):
    subcategory = await SubCategoryService.get_subcategory(subcategory_id)
    if not subcategory:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    return subcategory

@router.put("/{subcategory_id}", response_model=SubCategoryResponse)
async def update_subcategory(subcategory_id: str, subcategory: SubCategoryUpdate):
    updated = await SubCategoryService.update_subcategory(subcategory_id, subcategory)
    if not updated:
        raise HTTPException(status_code=404, detail="SubCategory not found")
    return updated

@router.delete("/{subcategory_id}")
async def delete_subcategory(subcategory_id: str):
    await SubCategoryService.delete_subcategory(subcategory_id)
    return {"status": "deleted"}
