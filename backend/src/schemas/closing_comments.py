from pydantic import BaseModel

class ClosingComments(BaseModel):
    reason: str
    comment: str