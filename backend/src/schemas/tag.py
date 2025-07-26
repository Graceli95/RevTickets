from pydantic import BaseModel
from typing import Optional

class TagBase(BaseModel):
    key: str
    value: str

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    key: Optional[str] = None
    value: Optional[str] = None

class TagResponse(TagBase):
    id: str
