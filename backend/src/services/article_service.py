from src.models.article import Article
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag
from src.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse, TagBase
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse
from beanie import PydanticObjectId
from typing import List
from datetime import datetime, timezone
from src.langchain_app.utils.text_to_vectors import upsert_article_embeddings, update_article_embeddings, delete_article_embeddings

class ArticleService:
    @staticmethod
    async def create_article(data: ArticleCreate) -> ArticleResponse:
        # Convert string IDs to PydanticObjectId
        category_id = PydanticObjectId(data.category_id)
        subcategory_id = PydanticObjectId(data.subcategory_id)
        
        # Get category and subcategory
        category = await Category.get(category_id)
        if not category:
            raise ValueError("Category not found")
        
        subcategory = await SubCategory.get(subcategory_id)
        if not subcategory:
            raise ValueError("Subcategory not found")

        # Create tag links if provided
        tag_links = []
        if data.tags:
            for tag_dict in data.tags:
                tag = Tag(**tag_dict)
                await tag.insert()
                tag_links.append(tag)

        # Create article
        article = Article(
            title=data.title,
            content=data.content,
            category_id=category,
            subcategory_id=subcategory,
            tags=tag_links,
            vector_ids=data.vector_ids or []
        )


        await article.insert()

        await upsert_article_embeddings(article, category.name, subcategory.name)

        return await ArticleService._build_response(article)

    @staticmethod
    async def get_article(article_id: str) -> ArticleResponse:
        article = await Article.get(PydanticObjectId(article_id))
        if not article:
            raise ValueError("Article not found")
        return await ArticleService._build_response(article)

    @staticmethod
    async def get_all_articles() -> List[ArticleResponse]:
        articles = await Article.find_all().to_list()
        return [await ArticleService._build_response(a) for a in articles]

    @staticmethod
    async def get_articles_by_category(category_id: str) -> List[ArticleResponse]:
        # Since Beanie is storing full objects, get all articles and filter in Python
        all_articles = await Article.find_all().to_list()
        articles = []
        for article in all_articles:
            if hasattr(article.category_id, 'id') and str(article.category_id.id) == category_id:
                articles.append(article)
        return [await ArticleService._build_response(a) for a in articles]

    @staticmethod
    async def get_articles_by_subcategory(subcategory_id: str) -> List[ArticleResponse]:
        # Since Beanie is storing full objects, get all articles and filter in Python
        all_articles = await Article.find_all().to_list()
        articles = []
        for article in all_articles:
            if hasattr(article.subcategory_id, 'id') and str(article.subcategory_id.id) == subcategory_id:
                articles.append(article)
        return [await ArticleService._build_response(a) for a in articles]

    @staticmethod
    async def update_article(article_id: str, data: ArticleUpdate) -> ArticleResponse:
        article = await Article.get(PydanticObjectId(article_id))
        if not article:
            raise ValueError("Article not found")

        if data.title is not None:
            article.title = data.title
        if data.content is not None:
            article.content = data.content
        if data.category_id is not None:
            category = await Category.get(PydanticObjectId(data.category_id))
            if category:
                article.category_id = category
        if data.subcategory_id is not None:
            subcategory = await SubCategory.get(PydanticObjectId(data.subcategory_id))
            if subcategory:
                article.subcategory_id = subcategory
        if data.vector_ids is not None:
            article.vector_ids = data.vector_ids
        
        # Update the updated_at timestamp
        article.updated_at = datetime.now(timezone.utc)
        
        await article.save()
        await update_article_embeddings(article, category.name, subcategory.name)
        return await ArticleService._build_response(article)

    @staticmethod
    async def delete_article(article_id: str) -> None:
        article = await Article.get(PydanticObjectId(article_id))
        if article:
            # Delete embeddings from Chroma
            if article.vector_ids:
                await delete_article_embeddings(article.article_id, article.vector_ids)

            await article.delete()

    @staticmethod
    async def _build_response(article: Article) -> ArticleResponse:
        # Handle linked objects - they might be Link objects (need fetch) or actual objects (already fetched)
        if hasattr(article.category_id, 'fetch'):
            category = await article.category_id.fetch() if article.category_id else None
        else:
            category = article.category_id
            
        if hasattr(article.subcategory_id, 'fetch'):
            subcategory = await article.subcategory_id.fetch() if article.subcategory_id else None
        else:
            subcategory = article.subcategory_id

        if category:
            category.id = str(category.id)
        if subcategory:
            subcategory.id = str(subcategory.id)
        
        # Handle category response
        category_response = CategoryResponse(**category.model_dump()) if category else None
        
        # Handle subcategory response with proper category Link handling
        if subcategory:
            subcategory_dict = subcategory.model_dump()
            subcategory_dict["id"] = str(subcategory.id)
            
            # Handle the category in subcategory - might be Link or actual object
            if subcategory.category:
                if hasattr(subcategory.category, 'ref') and subcategory.category.ref:
                    # It's a Link object, need to fetch
                    subcategory_category = await Category.get(subcategory.category.ref.id)
                    if subcategory_category:
                        subcategory_dict["category"] = {
                            "id": str(subcategory_category.id),
                            "name": subcategory_category.name,
                            "description": subcategory_category.description
                        }
                else:
                    # It's already a Category object
                    subcategory_dict["category"] = {
                        "id": str(subcategory.category.id),
                        "name": subcategory.category.name,
                        "description": subcategory.category.description
                    }
            
            subcategory_response = SubCategoryResponse(**subcategory_dict)
        else:
            subcategory_response = None

        # Handle tags
        tag_bases = []
        for tag_link in article.tags:
            if isinstance(tag_link, Tag):
                tag_bases.append(TagBase(key=tag_link.key, value=tag_link.value))
            else:
                tag_doc = await tag_link.fetch()
                if tag_doc:
                    tag_bases.append(TagBase(key=tag_doc.key, value=tag_doc.value))

        return ArticleResponse(
            id=str(article.id),
            title=article.title,
            content=article.content,
            category=category_response,
            subcategory=subcategory_response,
            tags=tag_bases,
            ai_generated_tags=article.ai_generated_tags or [],
            vector_ids=article.vector_ids or [],
            created_at=article.created_at,
            updated_at=article.updated_at,
        )

    # ENHANCEMENT L1 KB TITLE SEARCH - Search articles by title and content
    @staticmethod
    async def search_articles(query: str, category_id: str = None, subcategory_id: str = None) -> List[ArticleResponse]:
        """Search articles by title and content using MongoDB text search"""
        import re
        from beanie import PydanticObjectId
        
        # Build search filters
        filters = {}
        
        # Add category filter if provided
        if category_id:
            try:
                filters["category_id"] = PydanticObjectId(category_id)
            except:
                pass  # Invalid ID format, ignore filter
                
        # Add subcategory filter if provided  
        if subcategory_id:
            try:
                filters["subcategory_id"] = PydanticObjectId(subcategory_id)
            except:
                pass  # Invalid ID format, ignore filter
        
        # Create regex pattern for case-insensitive search in title and content
        search_pattern = re.compile(re.escape(query), re.IGNORECASE)
        
        # ENHANCEMENT L2 AI KB TAGS - Search in title, content, and AI-generated tags
        search_filter = {
            "$or": [
                {"title": {"$regex": search_pattern}},
                {"content.text": {"$regex": search_pattern}},
                {"ai_generated_tags": {"$regex": search_pattern}}
            ]
        }
        
        # Combine filters
        if filters:
            search_filter = {"$and": [search_filter, filters]}
        
        # Execute search
        articles = await Article.find(search_filter).to_list()
        
        # Build responses
        return [await ArticleService._build_response(article) for article in articles]

    # ENHANCEMENT L2 AI KB TAGS - Update article with AI-generated tags
    @staticmethod
    async def update_ai_tags(article_id: str, ai_tags: List[str]) -> ArticleResponse:
        """Update article with AI-generated tags"""
        article = await Article.get(PydanticObjectId(article_id))
        if not article:
            raise ValueError("Article not found")
        
        # Update AI-generated tags
        article.ai_generated_tags = ai_tags
        article.updated_at = datetime.now(timezone.utc)
        
        await article.save()
        return await ArticleService._build_response(article)
