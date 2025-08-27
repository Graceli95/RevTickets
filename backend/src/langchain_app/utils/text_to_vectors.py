import uuid
from typing import List
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.models.article import Article
from src.langchain_app.config.model_config import embedding_model
from src.langchain_app.config.chroma_config import get_chroma_client



COLLECTION_NAME = "articles_collection"

chroma_client = get_chroma_client()

async def upsert_article_embeddings(article: Article, category:str, subcategory: str, collection_name: str = COLLECTION_NAME) -> List[str]:
    """
    Chunk an article, embed it, and upsert into ChromaDB + update Article doc with chunk IDs.
    """

    # Step 1. Chunk the text
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
    chunks = splitter.split_text(article.content.text)

    # Step 2. Create/get collection
    collection = chroma_client.get_or_create_collection(name=collection_name)

    # Step 3. Embed chunks
    embeddings = embedding_model.embed_documents(chunks)

    # Step 4. Create UUIDs for each chunk
    chunk_ids = [str(uuid.uuid4()) for _ in chunks]

    # Step 5. Upsert into Chroma
    collection.upsert(
        documents=chunks,
        embeddings=embeddings,
        metadatas=[{
            "article_id": str(article.id),
            "title": article.title,
            "category": category,
            "sub_category": subcategory
        }] * len(chunks),
        ids=chunk_ids
    )

    # Step 6. Update Mongo Article doc with chunk IDs
    article.vector_ids = chunk_ids
    await article.save()

    return chunk_ids


async def update_article_embeddings(article: Article, category:str, subcategory:str, collection_name: str = COLLECTION_NAME):
    """
    Replace existing embeddings for an article when it is updated.
    """

    collection = chroma_client.get_or_create_collection(name=collection_name)

    # Delete old embeddings if they exist
    if article.vector_ids:
        collection.delete(ids=article.vector_ids)

    # Insert new embeddings
    return await upsert_article_embeddings(article, category, subcategory)


async def delete_article_embeddings(article: Article, collection_name: str = COLLECTION_NAME):
    """
    Delete an article's embeddings from ChromaDB and clear Mongo record.
    """

    collection = chroma_client.get_or_create_collection(name=collection_name)

    if article.vector_ids:
        collection.delete(ids=article.vector_ids)

    # Clear vector IDs from the article record
    article.vector_ids = []
    await article.save()
