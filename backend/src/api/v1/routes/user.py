# src/routers/user_router.py
from fastapi import APIRouter, Depends, HTTPException
from src.schemas.user import UserCreate, UserResponse, UserLogin, UserUpdate
from src.services.user_service import UserService
from src.models.user import User
from src.models.agent_info import AgentInfo
from src.models.category import Category
from src.models.subcategory import SubCategory
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from src.utils.security import decode_token, authenticate_user, create_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    user_doc = await UserService.register_user(user)
    return await UserService.user_to_response(user_doc)

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(data={"sub": form_data.username})
    return {"access_token": token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    payload = decode_token(token)
    user_email = payload.get("sub")
    if user_email is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await UserService.get_user_by_email(user_email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/profile", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    return await UserService.user_to_response(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_profile(user_data: UserUpdate, current_user: User = Depends(get_current_user)):
    return await UserService.update_user(str(current_user.id), user_data)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user_response = await UserService.get_user_by_id(user_id)
    if not user_response:
        raise HTTPException(status_code=404, detail="User not found")
    return user_response

# Agent profile endpoints
from pydantic import BaseModel
from typing import List

class AgentSpecializationRequest(BaseModel):
    category_id: str
    subcategory_ids: List[str] = []

@router.get("/profile/agent-specialization")
async def get_agent_specialization(current_user: User = Depends(get_current_user)):
    """Get current agent's category and subcategory specializations"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Only agents can access this endpoint")
    
    try:
        print(f"Getting agent specialization for user: {current_user.email} (ID: {current_user.id})")
        agent_info = await AgentInfo.find_one({"user.$id": current_user.id})
        print(f"Found agent_info: {agent_info}")
        
        if not agent_info:
            print("No agent_info found, returning empty specialization")
            return {"category_id": None, "subcategory_ids": []}
        
        # Fetch the linked objects
        category = await agent_info.category.fetch() if agent_info.category else None
        print(f"Fetched category: {category}")
        
        subcategories = []
        if agent_info.subcategory:
            print(f"Agent has {len(agent_info.subcategory)} subcategories")
            for subcat_link in agent_info.subcategory:
                subcat = await subcat_link.fetch()
                if subcat:
                    subcategories.append(str(subcat.id))
        
        result = {
            "category_id": str(category.id) if category else None,
            "subcategory_ids": subcategories
        }
        print(f"Returning specialization: {result}")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch agent specialization: {str(e)}")

@router.put("/profile/agent-specialization")
async def update_agent_specialization(
    specialization: AgentSpecializationRequest, 
    current_user: User = Depends(get_current_user)
):
    """Update agent's category and subcategory specializations"""
    if current_user.role != "agent":
        raise HTTPException(status_code=403, detail="Only agents can access this endpoint")
    
    try:
        print(f"Updating agent specialization for user: {current_user.email} (ID: {current_user.id})")
        print(f"Specialization data: {specialization}")
        
        # Find or create agent info
        agent_info = await AgentInfo.find_one({"user.$id": current_user.id})
        print(f"Found existing agent_info: {agent_info}")
        
        # Get category and subcategories
        category = await Category.get(specialization.category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        print(f"Found category: {category.name}")
        
        subcategories = []
        for subcat_id in specialization.subcategory_ids:
            subcat = await SubCategory.get(subcat_id)
            if subcat:
                subcategories.append(subcat)
        print(f"Found {len(subcategories)} subcategories")
        
        if agent_info:
            # Update existing agent info
            print("Updating existing agent info")
            agent_info.category = category
            agent_info.subcategory = subcategories
            await agent_info.save()
        else:
            # Create new agent info
            print("Creating new agent info")
            agent_info = AgentInfo(
                user=current_user,
                category=category,
                subcategory=subcategories
            )
            await agent_info.insert()
        
        print("Agent specialization updated successfully")
        return {"message": "Agent specialization updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update agent specialization: {str(e)}")

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # The frontend should remove the token. Nothing to do server-side.
    return {"message": "Logged out successfully"}
