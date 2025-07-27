# src/routers/user_router.py
from fastapi import APIRouter, Depends, HTTPException
from src.schemas.user import UserCreate, UserResponse, UserLogin, UserUpdate
from src.services.user_service import UserService
from src.models.user import User
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from src.utils.security import decode_token, authenticate_user, create_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

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

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # The frontend should remove the token. Nothing to do server-side.
    return {"message": "Logged out successfully"}
