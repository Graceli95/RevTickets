from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from src.core.config import settings

# Global database instance for GridFS
_database = None
from src.models.ticket import Ticket
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag
from src.models.comment import Comment
from src.models.user import User
from src.models.article import Article
from src.models.agent_info import AgentInfo
from src.models.chat_session import KBChatSession, ChatMessage

async def init_db():
    """
    Initializes the MongoDB connection and registers Beanie document models.
    """
    global _database
    
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_default_database()
    
    # Store database instance for GridFS
    _database = db
    
    await init_beanie(
        database=db,
        document_models=[
            Ticket,
            Category,
            SubCategory,    
            Tag,
            Comment,
            User,
            Article,
            AgentInfo,
            KBChatSession,
            ChatMessage
        ]
    )

    # ENHANCEMENT L2 SLA AUTOMATION - Create indices for efficient SLA queries
    tickets_collection = db.tickets
    await tickets_collection.create_index([("sla_due_date", 1), ("sla_breached", 1)])
    await tickets_collection.create_index([("sla_due_date", 1)])
    print("Created SLA indices for efficient queries")
    
    print("Finished DB init.")  # Debug print


async def get_database():
    """
    Get the database instance for direct MongoDB operations (GridFS, etc.)
    """
    global _database
    if _database is None:
        client = AsyncIOMotorClient(settings.mongodb_uri)
        _database = client.get_default_database()
    return _database
