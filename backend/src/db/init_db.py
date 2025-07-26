from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from src.core.config import settings
from src.models.ticket import Ticket
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag
from src.models.comment import Comment
from src.models.user import User
from src.models.article import Article

async def init_db():
    """
    Initializes the MongoDB connection and registers Beanie document models.
    """
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_default_database()
    
    await init_beanie(
        database=db,
        document_models=[
            Ticket,
            Category,
            SubCategory,    
            Tag,
            Comment,
            User,
            Article

        ]
    )
    print("Finished DB init.")  # Debug print
