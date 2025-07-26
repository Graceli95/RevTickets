from src.models.article import Article
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag
from src.schemas.article import ArticleCreate, ArticleUpdate, ArticleResponse, TagBase
from beanie import PydanticObjectId
from typing import List

class ArticleService:
    @staticmethod
    async def create_article(data: ArticleCreate) -> ArticleResponse:
        tag_links = []
        if data.tags:
            for tag_dict in data.tags:
                tag = Tag(**tag_dict)
                await tag.insert()
                tag_links.append(tag)

        category = await Category.get(data.category_id)
        subcategory = await SubCategory.get(data.subcategory_id)

        article = Article(
            title=data.title,
            content=data.content,
            tags=tag_links,
            category=category,
            subcategory=subcategory,
            vector_ids=data.vector_ids or []
        )
        await article.insert()

        article_response = ArticleResponse(
            id=str(article.id),
            title=article.title,
            content=article.content,
            tags=[TagBase(key=tag.key, value=tag.value) for tag in tag_links],
            category_id=str(category.id) if category else None,
            subcategory_id=str(subcategory.id) if subcategory else None,
            vector_ids=article.vector_ids
        )
        return article_response
    @staticmethod
    async def get_article(article_id: PydanticObjectId) -> ArticleResponse:
        article = await Article.get(article_id)
        if not article:
            raise ValueError("Article not found")
        return await ArticleService._build_response(article)

    @staticmethod
    async def get_all_articles() -> List[ArticleResponse]:
        articles = await Article.find_all().to_list()
        return [await ArticleService._build_response(a) for a in articles]

    @staticmethod
    async def get_articles_by_category(category_id: PydanticObjectId) -> List[ArticleResponse]:
        articles = await Article.find(Article.category.id == category_id).to_list()
        return [await ArticleService._build_response(a) for a in articles]

    @staticmethod
    async def get_articles_by_subcategory(subcategory_id: PydanticObjectId) -> List[ArticleResponse]:
        articles = await Article.find(Article.subcategory.id == subcategory_id).to_list()
        return [await ArticleService._build_response(a) for a in articles]

    @staticmethod
    async def update_article(article_id: PydanticObjectId, data: ArticleUpdate) -> ArticleResponse:
        article = await Article.get(article_id)
        if not article:
            raise ValueError("Article not found")

        if data.title:
            article.title = data.title
        if data.content:
            article.content = data.content
        if data.tags:
            tag_links = [await Tag.get(tid) for tid in data.tags if await Tag.get(tid)]
            article.tags = tag_links
        if data.category_id:
            article.category = await Category.get(data.category_id)
        if data.subcategory_id:
            article.subcategory = await SubCategory.get(data.subcategory_id)

        await article.save()
        return await ArticleService._build_response(article)

    @staticmethod
    async def delete_article(article_id: PydanticObjectId) -> None:
        article = await Article.get(article_id)
        if article:
            await article.delete()

    @staticmethod
    async def _build_response(article: Article) -> ArticleResponse:
        tag_bases = []

        for tag_link in article.tags:
            if isinstance(tag_link, Tag):
                tag_bases.append(TagBase(key=tag_link.key, value=tag_link.value))
            else:
                tag_doc = await tag_link.fetch()
                if tag_doc:
                    tag_bases.append(TagBase(key=tag_doc.key, value=tag_doc.value))

        category = await article.category.fetch() if article.category else None
        subcategory = await article.subcategory.fetch() if article.subcategory else None

        return ArticleResponse(
            id=str(article.id),
            title=article.title,
            content=article.content,
            tags=tag_bases,
            category_id=str(category.id) if article.category else None,
            subcategory_id=str(subcategory.id) if article.subcategory else None,
            vector_ids=article.vector_ids
        )
