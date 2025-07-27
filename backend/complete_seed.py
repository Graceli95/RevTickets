#!/usr/bin/env python3
"""
Quick script to complete the seed data that failed during initial seeding.
This creates the missing agent info and tickets.
"""

import asyncio
from datetime import datetime, timezone, timedelta
from src.models.user import User
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.ticket import Ticket
from src.models.agent_info import AgentInfo
from src.models.enums import UserRole, TicketStatus, TicketPriority, TicketSeverity
from src.models.rich_text import create_rich_text_from_html
from src.db.init_db import init_db

async def create_missing_agent_info():
    """Create agent info for the agents"""
    print("Creating missing agent info...")
    
    # Get all categories and subcategories
    categories = await Category.find_all().to_list()
    subcategories = await SubCategory.find_all().to_list()
    # Fetch category links for subcategories
    for subcat in subcategories:
        await subcat.fetch_link(SubCategory.category)
    
    # Get all agent users
    agents = await User.find(User.role == UserRole.agent).to_list()
    
    # Agent skill assignments
    agent_skills = [
        {
            "email": "sarah.wilson@company.com",
            "category_name": "Technical Support",
        },
        {
            "email": "david.brown@company.com", 
            "category_name": "Account Management",
        },
        {
            "email": "lisa.davis@company.com",
            "category_name": "General Inquiry", 
        }
    ]
    
    for skill_data in agent_skills:
        # Find the agent
        agent = None
        for a in agents:
            if a.email == skill_data["email"]:
                agent = a
                break
        
        if not agent:
            print(f"Agent not found: {skill_data['email']}")
            continue
        
        # Check if agent info already exists
        existing = await AgentInfo.find_one(AgentInfo.user.id == agent.id)
        if existing:
            print(f"Agent info already exists for: {skill_data['email']}")
            continue
        
        # Find the category
        category = None
        for c in categories:
            if c.name == skill_data["category_name"]:
                category = c
                break
        
        if not category:
            print(f"Category not found: {skill_data['category_name']}")
            continue
        
        # Find subcategories for this category
        agent_subcategories = []
        for subcat in subcategories:
            if subcat.category and str(subcat.category.id) == str(category.id):
                agent_subcategories.append(subcat)
        
        # Create agent info
        agent_info = AgentInfo(
            user=agent,
            category=category,
            subcategory=agent_subcategories[:2] if agent_subcategories else None  # Limit to 2 subcategories
        )
        
        await agent_info.insert()
        print(f"Created agent info for {skill_data['email']}: {skill_data['category_name']} with {len(agent_subcategories[:2])} subcategories")

async def create_missing_tickets():
    """Create tickets for users"""
    print("Creating missing tickets...")
    
    # Get users and categories
    users = await User.find(User.role == UserRole.user).to_list()
    agents = await User.find(User.role == UserRole.agent).to_list()
    categories = await Category.find_all().to_list()
    subcategories = await SubCategory.find_all().to_list()
    
    # Fetch category links for subcategories
    for subcat in subcategories:
        await subcat.fetch_link(SubCategory.category)
    
    # Simple ticket templates
    ticket_templates = [
        {
            "title": "Computer won't start",
            "description": "Desktop computer power issues",
            "content": "I came into work this morning and my computer won't start. I've checked the power cable and it's plugged in properly.",
            "priority": TicketPriority.high,
            "severity": TicketSeverity.high
        },
        {
            "title": "Password reset request",
            "description": "Forgot password and reset link not working",
            "content": "I can't remember my password and the password reset link in the email isn't working.",
            "priority": TicketPriority.medium,
            "severity": TicketSeverity.low
        },
        {
            "title": "Software installation request",
            "description": "Need Adobe Photoshop installed on workstation",
            "content": "I need Adobe Photoshop CC installed on my computer for a project I'm working on.",
            "priority": TicketPriority.medium,
            "severity": TicketSeverity.low
        }
    ]
    
    ticket_counter = 0
    
    # Create 2 tickets per user
    for user in users:
        for i in range(2):
            template = ticket_templates[ticket_counter % len(ticket_templates)]
            category = categories[ticket_counter % len(categories)]
            
            # Find a subcategory for this category
            subcategory = None
            for subcat in subcategories:
                if subcat.category and str(subcat.category.id) == str(category.id):
                    subcategory = subcat
                    break
            
            if not subcategory:
                print(f"No subcategory found for category {category.name}")
                continue
            
            # Assign to agent randomly
            agent = agents[ticket_counter % len(agents)] if ticket_counter % 3 == 0 else None
            status = TicketStatus.new if not agent else TicketStatus.in_progress
            
            # Create rich text content
            rich_content = create_rich_text_from_html(template["content"])
            
            # Create ticket
            ticket = Ticket(
                title=template["title"],
                description=template["description"],
                content=rich_content,
                categoryId=category,
                subCategoryId=subcategory,
                userId=user,
                agentId=agent,
                status=status,
                priority=template["priority"],
                severity=template["severity"],
                tagIds=[],
                createdAt=datetime.now(timezone.utc) - timedelta(days=ticket_counter),
                updatedAt=datetime.now(timezone.utc) - timedelta(hours=ticket_counter*2)
            )
            
            await ticket.insert()
            print(f"Created ticket: {template['title']} for user {user.email} (Agent: {agent.email if agent else 'Unassigned'})")
            
            ticket_counter += 1

async def main():
    """Main function"""
    print("Starting seed data completion...")
    
    # Initialize database
    await init_db()
    
    try:
        await create_missing_agent_info()
        await create_missing_tickets()
        
        print("\nSeed data completion finished!")
        
        # Print summary
        user_count = await User.count_documents()
        category_count = await Category.count_documents()
        agent_info_count = await AgentInfo.count_documents()
        ticket_count = await Ticket.count_documents()
        
        print(f"Total users: {user_count}")
        print(f"Total categories: {category_count}")
        print(f"Total agent info records: {agent_info_count}")
        print(f"Total tickets: {ticket_count}")
        
    except Exception as e:
        print(f"Error completing seed data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())