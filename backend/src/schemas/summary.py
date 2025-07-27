from pydantic import BaseModel

class TicketSummaryResponse(BaseModel):
    summary: str