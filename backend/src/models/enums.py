from enum import Enum

class TicketStatus(str, Enum):
    open = "open"
    in_progress = "in_progress"
    closed = "closed"
    on_hold = "on_hold"

class TicketPriority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TicketSeverity(str, Enum):
    info = "info"
    low = "low"
    moderate = "moderate"
    high = "high"
    critical = "critical"

class UserRole(str, Enum):
    user = "user"
    agent = "agent"

