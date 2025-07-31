from enum import Enum

class TicketStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    waiting_for_customer = "waiting_for_customer"
    waiting_for_agent = "waiting_for_agent"
    closed = "closed"
    resolved = "resolved"

class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class UserRole(str, Enum):
    user = "user"
    agent = "agent"

