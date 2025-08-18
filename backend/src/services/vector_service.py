# ENHANCEMENT L3: KB CHAT - Vector database service using ChromaDB for RAG implementation

import asyncio
from typing import List, Dict, Any, Optional
import hashlib
import chromadb
from chromadb.utils import embedding_functions
from src.models.article import Article
from src.langchain_app.config.model_config import embedding_model
from src.core.config import settings
import logging

logger = logging.getLogger(__name__)


class VectorService:
    """Service for managing vector embeddings and similarity search using ChromaDB"""
    
    _client = None
    _collection = None
    
    @classmethod
    def get_client(cls):
        """Get or create ChromaDB client"""
        if cls._client is None:
            cls._client = chromadb.HttpClient(host=settings.chroma_url.replace('http://', '').split(':')[0], 
                                             port=int(settings.chroma_url.split(':')[-1]))
        return cls._client
    
    @classmethod
    def get_collection(cls):
        """Get or create the articles collection"""
        if cls._collection is None:
            client = cls.get_client()
            # Create collection with custom embedding function
            try:
                cls._collection = client.get_collection("kb_articles")
            except ValueError:
                # Collection doesn't exist, create it
                cls._collection = client.create_collection(
                    name="kb_articles",
                    metadata={"description": "Knowledge base articles for RAG"}
                )
        return cls._collection
    
    @staticmethod
    async def initialize_embeddings():
        """Initialize or update embeddings for all articles"""
        logger.info("Starting ChromaDB embedding initialization...")
        
        # Get all articles
        articles = await Article.find_all().to_list()
        
        processed_count = 0
        for article in articles:
            try:
                await VectorService._process_article_embedding(article)
                processed_count += 1
                
                if processed_count % 10 == 0:
                    logger.info(f"Processed {processed_count}/{len(articles)} articles")
                    
            except Exception as e:
                logger.error(f"Failed to process article {article.id}: {e}")
        
        logger.info(f"ChromaDB embedding initialization complete. Processed {processed_count} articles.")
    
    @staticmethod
    async def _process_article_embedding(article: Article):
        """Process embedding for a single article"""
        
        # Extract text content
        content_text = VectorService._extract_text_content(article)
        if not content_text or len(content_text.strip()) < 10:
            logger.info(f"Skipping article {article.id} - insufficient content")
            return  # Skip articles with insufficient content
        
        # Generate content hash
        content_hash = hashlib.md5(content_text.encode()).hexdigest()
        
        collection = VectorService.get_collection()
        article_id = str(article.id)
        
        # Check if embedding already exists and is current
        try:
            existing = collection.get(ids=[article_id], include=["metadatas"])
            if (existing and existing['ids'] and 
                existing['metadatas'][0].get('content_hash') == content_hash):
                logger.info(f"Article {article_id} embedding is up to date")
                return  # Already up to date
        except Exception:
            # Article doesn't exist in collection, we'll create it
            pass
        
        # Generate embedding using LangChain's embedding model
        try:
            embedding = await VectorService._generate_embedding(content_text)
            
            # Prepare metadata
            metadata = {
                "title": article.title,
                "content_hash": content_hash,
                "content_preview": content_text[:200] + "..." if len(content_text) > 200 else content_text,
                "article_id": article_id
            }
            
            # Add or update in ChromaDB
            collection.upsert(
                ids=[article_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[content_text]
            )
            
            logger.info(f"Successfully processed embedding for article {article_id}")
            
        except Exception as e:
            logger.error(f"Failed to generate embedding for article {article.id}: {e}")
            raise
    
    @staticmethod
    def _extract_text_content(article: Article) -> str:
        """Extract plain text from article content"""
        
        if not article.content:
            return ""
        
        # Handle RichTextContent
        if hasattr(article.content, 'text') and article.content.text:
            return f"{article.title}\n\n{article.content.text}"
        elif hasattr(article.content, 'html') and article.content.html:
            # Strip HTML tags
            import re
            text = re.sub(r'<[^>]+>', '', article.content.html)
            return f"{article.title}\n\n{text.strip()}"
        else:
            # Fallback to string representation
            content_str = str(article.content)
            if content_str and not content_str.startswith('{'):
                return f"{article.title}\n\n{content_str}"
        
        return article.title  # At minimum return title
    
    @staticmethod
    async def _generate_embedding(text: str) -> List[float]:
        """Generate embedding for text using configured embedding model"""
        try:
            # Use the configured embedding model from LangChain
            embedding = await embedding_model.aembed_query(text)
            return embedding
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            raise
    
    @staticmethod
    async def search_similar_articles(query: str, limit: int = 5, 
                                    similarity_threshold: float = 0.6) -> List[Dict[str, Any]]:
        """Search for articles similar to the query using ChromaDB"""
        
        try:
            # Generate query embedding
            query_embedding = await VectorService._generate_embedding(query)
            
            # Search in ChromaDB
            collection = VectorService.get_collection()
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                include=["metadatas", "documents", "distances"]
            )
            
            # Format results
            similarities = []
            if results['ids'] and results['ids'][0]:  # Check if we have results
                for i, article_id in enumerate(results['ids'][0]):
                    metadata = results['metadatas'][0][i]
                    distance = results['distances'][0][i]
                    
                    # Convert distance to similarity (ChromaDB returns cosine distance)
                    similarity = 1 - distance
                    
                    if similarity >= similarity_threshold:
                        similarities.append({
                            'article_id': metadata['article_id'],
                            'title': metadata['title'],
                            'content_preview': metadata['content_preview'],
                            'similarity': similarity
                        })
            
            # Results are already sorted by similarity (distance) from ChromaDB
            logger.info(f"Found {len(similarities)} similar articles for query")
            return similarities
            
        except Exception as e:
            logger.error(f"ChromaDB similarity search failed: {e}")
            return []
    
    @staticmethod
    async def update_article_embedding(article_id: str):
        """Update embedding for a specific article"""
        try:
            article = await Article.get(article_id)
            if article:
                await VectorService._process_article_embedding(article)
        except Exception as e:
            logger.error(f"Failed to update embedding for article {article_id}: {e}")
    
    @staticmethod
    async def delete_article_embedding(article_id: str):
        """Delete embedding for an article from ChromaDB"""
        try:
            collection = VectorService.get_collection()
            collection.delete(ids=[article_id])
            logger.info(f"Deleted embedding for article {article_id}")
        except Exception as e:
            logger.error(f"Failed to delete embedding for article {article_id}: {e}")
    
    @staticmethod
    def get_collection_info():
        """Get information about the ChromaDB collection"""
        try:
            collection = VectorService.get_collection()
            count = collection.count()
            return {
                "name": "kb_articles",
                "count": count,
                "chroma_url": settings.chroma_url
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {
                "name": "kb_articles", 
                "count": 0,
                "error": str(e),
                "chroma_url": settings.chroma_url
            }