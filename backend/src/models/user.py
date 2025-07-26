# src/models/user.py
from beanie import Document, Link
from pydantic import EmailStr, Field
from typing import Optional, List
from datetime import datetime
from .enums import UserRole
from .category import Category
from .subcategory import SubCategory
class User(Document):
    first_name: str
    last_name: str
    email: EmailStr
    hashed_password: str
    role: UserRole = Field(default=UserRole.user, description="User role in the system")
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
