# src/services/user_service.py
from src.models.user import User
from src.models.agent_info import AgentInfo
from src.schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, AgentSkills
from src.schemas.category import CategoryResponse
from src.schemas.subcategory import SubCategoryResponse
from src.utils.security import hash_password, verify_password, create_access_token
from pydantic import EmailStr
from beanie import PydanticObjectId
from fastapi import HTTPException
from typing import Optional

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
    
    @staticmethod
    async def get_user_by_id(user_id: str) -> Optional[UserResponse]:
        user = await User.get(user_id)
        if not user:
            return None
        return await UserService.user_to_response(user)
    
    @staticmethod
    async def update_user(user_id: str, user_data: UserUpdate) -> UserResponse:
        user = await User.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update basic fields
        if user_data.first_name:
            user.first_name = user_data.first_name
        if user_data.last_name:
            user.last_name = user_data.last_name
        if user_data.email:
            user.email = user_data.email
        
        await user.save()
        return await UserService.user_to_response(user)
    
    @staticmethod
    async def user_to_response(user: User) -> UserResponse:
        """Convert User model to UserResponse schema, including agent skills if applicable"""
        agent_skills = None
        
        # If user is an agent, fetch their skills
        if user.role == "agent":
            agent_info = await AgentInfo.find_one(AgentInfo.user.id == str(user.id))
            if agent_info:
                # Convert category
                category_response = None
                if agent_info.category:
                    cat_dict = agent_info.category.model_dump()
                    cat_dict["id"] = str(agent_info.category.id)
                    category_response = CategoryResponse(**cat_dict)
                
                # Convert subcategories
                subcategory_responses = None
                if agent_info.subcategory:
                    subcategory_responses = []
                    for subcategory in agent_info.subcategory:
                        subcat_dict = subcategory.model_dump()
                        subcat_dict["id"] = str(subcategory.id)
                        if subcategory.category:
                            subcat_dict["category"]["id"] = str(subcategory.category.id)
                        subcategory_responses.append(SubCategoryResponse(**subcat_dict))
                
                agent_skills = AgentSkills(
                    category=category_response,
                    subcategories=subcategory_responses
                )
        
        return UserResponse(
            id=str(user.id),
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            role=user.role,
            agent_skills=agent_skills,
            created_at=user.created_at
        )