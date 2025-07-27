from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    password: str
    role: Optional[str] = "user"

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None

class AgentSkills(BaseModel):
    category: Optional['CategoryResponse'] = None
    subcategories: Optional[List['SubCategoryResponse']] = None

class UserResponse(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: EmailStr
    role: str
    agent_skills: Optional[AgentSkills] = None
    created_at: datetime

# Forward references for circular imports
from .category import CategoryResponse
from .subcategory import SubCategoryResponse

AgentSkills.model_rebuild()
UserResponse.model_rebuild()

class UserLogin(BaseModel):
    email: EmailStr
    password: str