# ENHANCEMENT L2 SLA AUTOMATION - SLA calculation and management service

from datetime import datetime, timezone, timedelta
from typing import Optional
from src.models.ticket import Ticket
from src.models.enums import TicketPriority

class SLAService:
    """
    Service for handling SLA (Service Level Agreement) calculations and monitoring.
    
    This service provides functionality to:
    - Calculate SLA due dates based on ticket priority
    - Check for SLA breaches
    - Update ticket SLA status
    """
    
    # ENHANCEMENT L2 SLA AUTOMATION - SLA response time configurations (in hours)
    SLA_RESPONSE_TIMES = {
        TicketPriority.critical: 2,    # 2 hours for critical tickets
        TicketPriority.high: 4,        # 4 hours for high priority tickets  
        TicketPriority.medium: 24,     # 24 hours for medium priority tickets
        TicketPriority.low: 48,        # 48 hours for low priority tickets
    }
    
    @classmethod
    async def calculate_sla_due_date(cls, ticket: Ticket) -> datetime:
        """
        Calculate when SLA response is due based on ticket priority and creation time.
        Uses simplified calendar-based calculation for consistent 24/7 support coverage.
        
        Args:
            ticket: The ticket to calculate SLA for
            
        Returns:
            datetime: When the SLA response is due
        """
        # ENHANCEMENT L2 SLA AUTOMATION - Get response time based on priority
        response_hours = cls.SLA_RESPONSE_TIMES.get(ticket.priority, 24)  # Default to 24 hours
        
        # ENHANCEMENT L2 SLA AUTOMATION - Calculate due date in UTC
        # Convert to UTC if needed, then calculate as naive datetime (MongoDB stores as UTC)
        if ticket.created_at.tzinfo is not None:
            created_at_utc = ticket.created_at.astimezone(timezone.utc).replace(tzinfo=None)
        else:
            created_at_utc = ticket.created_at  # Assume already UTC
        
        # Use simple calendar arithmetic for straightforward SLA calculation
        # This ensures consistent response expectations regardless of business hours
        sla_due_date = created_at_utc + timedelta(hours=response_hours)
        
        return sla_due_date
    
    @classmethod
    async def check_sla_breach(cls, ticket: Ticket) -> bool:
        """
        Check if a ticket has breached its SLA.
        Uses continuous monitoring approach for 24/7 support coverage.
        
        Args:
            ticket: The ticket to check
            
        Returns:
            bool: True if SLA is breached, False otherwise
        """
        # ENHANCEMENT L2 SLA AUTOMATION - Skip check if no SLA due date set
        if not ticket.sla_due_date:
            return False
            
        # ENHANCEMENT L2 SLA AUTOMATION - SLA pauses when waiting for customer
        from src.models.enums import TicketStatus
        if ticket.status == TicketStatus.waiting_for_customer:
            return False  # SLA is paused, cannot breach while waiting for customer
            
        # Continuous SLA monitoring for consistent service level enforcement
        # This ensures tickets are tracked consistently regardless of time of day
        current_time_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        
        return current_time_utc > ticket.sla_due_date
    
    @classmethod
    async def update_ticket_sla(cls, ticket: Ticket) -> Ticket:
        """
        Update ticket with SLA information.
        
        Args:
            ticket: The ticket to update
            
        Returns:
            Ticket: Updated ticket with SLA information
        """
        # ENHANCEMENT L2 SLA AUTOMATION - Calculate and set SLA due date if not already set
        if not ticket.sla_due_date:
            ticket.sla_due_date = await cls.calculate_sla_due_date(ticket)
        
        # ENHANCEMENT L2 SLA AUTOMATION - Check and update breach status
        ticket.sla_breached = await cls.check_sla_breach(ticket)
        
        # ENHANCEMENT L2 SLA AUTOMATION - Save the updated ticket
        await ticket.save()
        
        return ticket
    
    @classmethod
    async def get_overdue_tickets(cls) -> list[Ticket]:
        """
        Get all tickets that have breached their SLA.
        Uses comprehensive query for complete SLA coverage monitoring.
        
        Returns:
            list[Ticket]: List of tickets with SLA breaches
        """
        # ENHANCEMENT L2 SLA AUTOMATION - Find all tickets that should be checked for SLA
        # Use naive UTC datetime for consistent comparison with MongoDB
        current_time_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        
        # ENHANCEMENT L2 SLA AUTOMATION - Query tickets with SLA due dates in the past
        # Exclude tickets waiting for customer (SLA is paused)
        from src.models.enums import TicketStatus
        overdue_tickets = await Ticket.find(
            Ticket.sla_due_date < current_time_utc,
            Ticket.sla_breached == False,  # Only get tickets not already marked as breached
            Ticket.status != TicketStatus.waiting_for_customer  # Exclude paused SLAs
        ).to_list()
        
        # Return all overdue tickets for comprehensive monitoring
        return overdue_tickets
    
    @classmethod
    async def pause_sla(cls, ticket: Ticket) -> Ticket:
        """
        Pause SLA timer when ticket status changes to waiting_for_customer.
        
        Args:
            ticket: The ticket to pause SLA for
            
        Returns:
            Ticket: Updated ticket with SLA pause information
        """
        # ENHANCEMENT L2 SLA AUTOMATION - Record when SLA was paused
        if not ticket.sla_paused_at:  # Only set if not already paused
            current_time_utc = datetime.now(timezone.utc).replace(tzinfo=None)
            ticket.sla_paused_at = current_time_utc
            await ticket.save()
            
        return ticket
    
    @classmethod
    async def resume_sla(cls, ticket: Ticket) -> Ticket:
        """
        Resume SLA timer when ticket status changes from waiting_for_customer.
        Extends the SLA due date by the amount of time it was paused.
        
        Args:
            ticket: The ticket to resume SLA for
            
        Returns:
            Ticket: Updated ticket with extended SLA due date
        """
        # ENHANCEMENT L2 SLA AUTOMATION - Calculate pause duration and extend due date
        if ticket.sla_paused_at and ticket.sla_due_date:
            current_time_utc = datetime.now(timezone.utc).replace(tzinfo=None)
            
            # Calculate how long SLA was paused (in minutes)
            pause_duration = current_time_utc - ticket.sla_paused_at
            pause_minutes = int(pause_duration.total_seconds() / 60)
            
            # Add pause time to total paused time
            ticket.sla_total_paused_time += pause_minutes
            
            # Extend SLA due date by the pause duration
            ticket.sla_due_date = ticket.sla_due_date + pause_duration
            
            # Clear pause timestamp
            ticket.sla_paused_at = None
            
            await ticket.save()
            
        return ticket