from contextlib import asynccontextmanager
from fastapi import FastAPI
from src.db.init_db import init_db
from src.api.v1.routes.ticket import router as ticket_router
from src.api.v1.routes.tag import router as tag_router
from src.api.v1.routes.category import router as category_router
from src.api.v1.routes.subcategory import router as subcategory_router
from src.api.v1.routes.comment import router as comment_router
from src.api.v1.routes.user import router as user_router

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    pass

app = FastAPI(
    title="Ticketing System",
    description="API for Ticketing System",
    version="1.0.0",
    lifespan=lifespan
)
app.include_router(ticket_router)
app.include_router(tag_router)
app.include_router(category_router)
app.include_router(subcategory_router)
app.include_router(comment_router)
app.include_router(user_router)