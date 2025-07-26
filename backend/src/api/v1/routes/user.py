# src/routers/user_router.py
from fastapi import APIRouter, Depends, HTTPException
from src.schemas.user import UserCreate, UserResponse, UserLogin
from src.services.user_service import UserService
from src.models.user import User
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from src.utils.security import decode_token, authenticate_user, create_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/register", response_model=UserResponse)
async def register_user(user: UserCreate):
    user_doc = await UserService.register_user(user)
    return UserResponse(
        id=str(user_doc.id),
        first_name=user_doc.first_name,
        last_name=user_doc.last_name,
        email=user_doc.email,
        role=user_doc.role,
        created_at=user_doc.created_at
    )

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
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
    return UserResponse(
        id=str(current_user.id),
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        email=current_user.email,
        role=current_user.role,
        created_at=current_user.created_at,

    )

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    # The frontend should remove the token. Nothing to do server-side.
    return {"message": "Logged out successfully"}
