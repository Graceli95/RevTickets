# src/models/agent_info.py
from beanie import Document, Link
from typing import Optional, List
from beanie import PydanticObjectId
from src.models.user import User
from src.models.category import Category
from src.models.subcategory import SubCategory

class AgentInfo(Document):
    user: Link[User]
    category: Optional[Link[Category]]
    subcategory: Optional[List[Link[SubCategory]]]

    class Settings:
        name = "agent_info"
