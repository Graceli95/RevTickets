# src/services/user_service.py
from src.models.user import User
from src.schemas.user import UserCreate, UserLogin
from src.utils.security import hash_password, verify_password, create_access_token
from pydantic import EmailStr
from beanie import PydanticObjectId
from fastapi import HTTPException

class UserService:
    @staticmethod
    async def register_user(user_data: UserCreate):
        existing = await User.find_one(User.email == user_data.email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user = User(
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            hashed_password=hash_password(user_data.password),
            role=user_data.role
        )
        await user.insert()
        return user

    @staticmethod
    async def get_user_by_email(user_email: str):
        user = await User.find_one(User.email == user_email)
        return user