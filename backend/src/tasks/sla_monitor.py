# ENHANCEMENT L2 SLA AUTOMATION - Celery task for monitoring SLA breaches

from celery import Celery
from celery.schedules import crontab
from datetime import datetime, timezone
import asyncio
import os
from src.services.sla_service import SLAService
from src.models.ticket import Ticket
import logging

# ENHANCEMENT L2 SLA AUTOMATION - Configure logging for SLA monitoring
logger = logging.getLogger(__name__)

# ENHANCEMENT L2 SLA AUTOMATION - Get Redis URL from environment
REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')

# ENHANCEMENT L2 SLA AUTOMATION - Initialize Celery app
celery_app = Celery('sla_monitor')

# ENHANCEMENT L2 SLA AUTOMATION - Configure Celery settings
celery_app.conf.update(
    broker_url=REDIS_URL,
    result_backend=REDIS_URL,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    # ENHANCEMENT L2 SLA AUTOMATION - Beat schedule for periodic tasks
    beat_schedule={
        'monitor-sla-breaches': {
            'task': 'monitor_sla_breaches',
            'schedule': crontab(minute='*/3'),  # Run every 3 minutes
        },
    },
)

@celery_app.task(name='monitor_sla_breaches')
def monitor_sla_breaches():
    """
    Celery task that runs periodically to check for SLA breaches.
    
    This task:
    1. Finds all overdue tickets
    2. Updates their SLA breach status
    3. Logs the results

    This task should be scheduled to run every 1 minute using Celery Beat.
    """
    # ENHANCEMENT L2 SLA AUTOMATION - Run async SLA monitoring in sync context
    asyncio.run(async_monitor_sla_breaches())

async def async_monitor_sla_breaches():
    """
    Async implementation of SLA breach monitoring.
    """
    try:
        # ENHANCEMENT L2 SLA AUTOMATION - Initialize database connection for Celery worker
        from src.db.init_db import init_db
        await init_db()
        
        # ENHANCEMENT L2 SLA AUTOMATION - Log start of SLA monitoring
        logger.info("Starting SLA breach monitoring...")
        current_time = datetime.now(timezone.utc)
        
        # ENHANCEMENT L2 SLA AUTOMATION - Get all overdue tickets
        overdue_tickets = await SLAService.get_overdue_tickets()
        
        if not overdue_tickets:
            logger.info("No overdue tickets found.")
            return
        
        # ENHANCEMENT L2 SLA AUTOMATION - Process each overdue ticket
        breach_count = 0
        for ticket in overdue_tickets:
            try:
                # ENHANCEMENT L2 SLA AUTOMATION - Update ticket SLA status
                await SLAService.update_ticket_sla(ticket)
                
                # ENHANCEMENT L2 SLA AUTOMATION - Log the breach
                logger.warning(
                    f"SLA breach detected for ticket {ticket.id}: "
                    f"Due: {ticket.sla_due_date}, Current: {current_time}"
                )
                breach_count += 1
                
            except Exception as e:
                # ENHANCEMENT L2 SLA AUTOMATION - Log errors for individual tickets
                logger.error(f"Error updating SLA for ticket {ticket.id}: {str(e)}")
        
        # ENHANCEMENT L2 SLA AUTOMATION - Log summary of monitoring results
        logger.info(f"SLA monitoring completed. {breach_count} breaches detected and updated.")
        
    except Exception as e:
        # ENHANCEMENT L2 SLA AUTOMATION - Log any general errors
        logger.error(f"Error in SLA monitoring task: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")

@celery_app.task(name='update_new_ticket_sla')
def update_new_ticket_sla(ticket_id: str):
    """
    Celery task to set SLA due date for newly created tickets.
    
    Args:
        ticket_id: The ID of the ticket to update
    """
    # ENHANCEMENT L2 SLA AUTOMATION - Run async SLA update in sync context
    asyncio.run(async_update_new_ticket_sla(ticket_id))

async def async_update_new_ticket_sla(ticket_id: str):
    """
    Async implementation of new ticket SLA setup.
    """
    try:
        # ENHANCEMENT L2 SLA AUTOMATION - Initialize database connection for Celery worker
        from src.db.init_db import init_db
        await init_db()
        
        # ENHANCEMENT L2 SLA AUTOMATION - Get the ticket
        ticket = await Ticket.get(ticket_id)
        if not ticket:
            logger.error(f"Ticket {ticket_id} not found for SLA update")
            return
        
        # ENHANCEMENT L2 SLA AUTOMATION - Update ticket with SLA information
        await SLAService.update_ticket_sla(ticket)
        
        logger.info(f"SLA due date set for ticket {ticket_id}: {ticket.sla_due_date}")
        
    except Exception as e:
        logger.error(f"Error setting SLA for ticket {ticket_id}: {str(e)}")
        import traceback
        logger.error(f"Full traceback: {traceback.format_exc()}")

# ENHANCEMENT L2 SLA AUTOMATION - Beat schedule is configured above in celery_app.conf.update()