from fastapi import APIRouter, HTTPException, Depends
from src.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse
from beanie import PydanticObjectId
from src.services.article_service import ArticleService
from typing import List
from src.utils.security import get_current_agent_user

router = APIRouter(prefix="/articles", tags=["Articles"], dependencies=[Depends(get_current_agent_user)] )

@router.post("/", response_model=ArticleResponse)
async def create_article(data: ArticleCreate):
    try:
        return await ArticleService.create_article(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[ArticleResponse])
async def get_all_articles():
    return await ArticleService.get_all_articles()

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_article(article_id: PydanticObjectId):
    try:
        return await ArticleService.get_article(article_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/category/{category_id}", response_model=List[ArticleResponse])
async def get_articles_by_category(category_id: PydanticObjectId):
    return await ArticleService.get_articles_by_category(category_id)

@router.get("/subcategory/{subcategory_id}", response_model=List[ArticleResponse])
async def get_articles_by_subcategory(subcategory_id: PydanticObjectId):
    return await ArticleService.get_articles_by_subcategory(subcategory_id)

@router.put("/{article_id}", response_model=ArticleResponse)
async def update_article(article_id: PydanticObjectId, data: ArticleUpdate):
    try:
        return await ArticleService.update_article(article_id, data)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{article_id}")
async def delete_article(article_id: PydanticObjectId):
    await ArticleService.delete_article(article_id)
    return {"message": "Article deleted"}
