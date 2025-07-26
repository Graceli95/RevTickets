#!/usr/bin/env python3
"""
Seed data script for the ticketing system.
Creates demo users, categories, tickets, and other data for development and demos.
"""

import asyncio
from datetime import datetime, timedelta, timezone
from src.models.user import User
from src.models.category import Category
from src.models.subcategory import SubCategory
from src.models.tag import Tag
from src.models.ticket import Ticket
from src.models.comment import Comment
from src.models.enums import UserRole, TicketStatus, TicketPriority, TicketSeverity
from src.models.rich_text import create_rich_text_from_html
from src.utils.security import hash_password
from src.db.init_db import init_db

async def create_demo_users():
    """Create demo users (regular users and agents)"""
    print("Creating demo users...")
    
    # Demo regular users
    demo_users = [
        {
            "first_name": "John",
            "last_name": "Doe",
            "email": "john.doe@company.com",
            "password": "password123",
            "role": UserRole.user
        },
        {
            "first_name": "Jane",
            "last_name": "Smith",
            "email": "jane.smith@company.com",
            "password": "password123",
            "role": UserRole.user
        },
        {
            "first_name": "Mike",
            "last_name": "Johnson",
            "email": "mike.johnson@company.com",
            "password": "password123",
            "role": UserRole.user
        }
    ]
    
    # Demo agents
    demo_agents = [
        {
            "first_name": "Sarah",
            "last_name": "Wilson",
            "email": "sarah.wilson@company.com",
            "password": "password123",
            "role": UserRole.agent
        },
        {
            "first_name": "David",
            "last_name": "Brown",
            "email": "david.brown@company.com",
            "password": "password123",
            "role": UserRole.agent
        },
        {
            "first_name": "Lisa",
            "last_name": "Davis",
            "email": "lisa.davis@company.com",
            "password": "password123",
            "role": UserRole.agent
        }
    ]
    
    all_users = demo_users + demo_agents
    created_users = []
    
    for user_data in all_users:
        # Check if user already exists
        existing_user = await User.find_one(User.email == user_data["email"])
        if not existing_user:
            user = User(
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                role=user_data["role"]
            )
            await user.insert()
            created_users.append(user)
            print(f"Created {user_data['role']} user: {user_data['email']}")
        else:
            created_users.append(existing_user)
            print(f"User already exists: {user_data['email']}")
    
    return created_users

async def create_demo_categories():
    """Create demo categories and subcategories"""
    print("Creating demo categories...")
    
    categories_data = [
        {
            "name": "Technical Support",
            "description": "Hardware and software technical issues",
            "subcategories": [
                {"name": "Hardware Issues", "description": "Physical device problems"},
                {"name": "Software Issues", "description": "Application and OS problems"},
                {"name": "Network Issues", "description": "Connectivity and network problems"}
            ]
        },
        {
            "name": "Account Management",
            "description": "User account and access related issues",
            "subcategories": [
                {"name": "Password Reset", "description": "Password and login issues"},
                {"name": "Access Permissions", "description": "Role and permission changes"},
                {"name": "Account Creation", "description": "New account setup"}
            ]
        },
        {
            "name": "General Inquiry",
            "description": "General questions and information requests",
            "subcategories": [
                {"name": "How-to Questions", "description": "Usage and feature questions"},
                {"name": "Feature Requests", "description": "New feature suggestions"},
                {"name": "Billing Questions", "description": "Payment and billing inquiries"}
            ]
        }
    ]
    
    created_categories = []
    
    for cat_data in categories_data:
        # Check if category exists
        existing_cat = await Category.find_one(Category.name == cat_data["name"])
        if not existing_cat:
            category = Category(
                name=cat_data["name"],
                description=cat_data["description"],
                tags=[]
            )
            await category.insert()
            created_categories.append(category)
            print(f"Created category: {cat_data['name']}")
            
            # Create subcategories
            for subcat_data in cat_data["subcategories"]:
                subcategory = SubCategory(
                    name=subcat_data["name"],
                    description=subcat_data["description"],
                    category=category
                )
                await subcategory.insert()
                print(f"  Created subcategory: {subcat_data['name']}")
        else:
            created_categories.append(existing_cat)
            print(f"Category already exists: {cat_data['name']}")
    
    return created_categories

async def create_demo_tags():
    """Create demo tags"""
    print("Creating demo tags...")
    
    tags_data = [
        {"key": "priority", "value": "urgent"},
        {"key": "priority", "value": "normal"},
        {"key": "priority", "value": "low"},
        {"key": "department", "value": "IT"},
        {"key": "department", "value": "HR"},
        {"key": "department", "value": "Finance"},
        {"key": "type", "value": "bug"},
        {"key": "type", "value": "feature"},
        {"key": "type", "value": "support"},
        {"key": "environment", "value": "production"},
        {"key": "environment", "value": "staging"},
        {"key": "environment", "value": "development"}
    ]
    
    created_tags = []
    
    for tag_data in tags_data:
        # Check if tag exists
        existing_tag = await Tag.find_one(
            Tag.key == tag_data["key"],
            Tag.value == tag_data["value"]
        )
        if not existing_tag:
            tag = Tag(
                key=tag_data["key"],
                value=tag_data["value"]
            )
            await tag.insert()
            created_tags.append(tag)
            print(f"Created tag: {tag_data['key']}:{tag_data['value']}")
        else:
            created_tags.append(existing_tag)
    
    return created_tags

async def create_demo_tickets(users, categories):
    """Create demo tickets with various statuses"""
    print("Creating demo tickets...")
    
    # Get subcategories
    subcategories = await SubCategory.find_all().to_list()
    if not subcategories:
        print("No subcategories found, skipping ticket creation")
        return []
    
    # Filter users and agents
    regular_users = [u for u in users if u.role == UserRole.user]
    agents = [u for u in users if u.role == UserRole.agent]
    
    if not regular_users or not categories:
        print("Missing users or categories, skipping ticket creation")
        return []
    
    tickets_data = [
        {
            "title": "Computer won't start",
            "description": "My desktop computer is not turning on when I press the power button",
            "content": "I came into work this morning and my computer won't start. I've checked the power cable and it's plugged in properly. The monitor is working fine. When I press the power button, nothing happens - no lights, no fan noise, nothing.",
            "priority": TicketPriority.high,
            "severity": TicketSeverity.high,
            "status": TicketStatus.open,
            "user_index": 0,
            "category_name": "Technical Support"
        },
        {
            "title": "Password reset request",
            "description": "I forgot my password and need to reset it",
            "content": "I can't remember my password and the password reset link in the email isn't working. Can someone help me reset my password manually?",
            "priority": TicketPriority.medium,
            "severity": TicketSeverity.low,
            "status": TicketStatus.in_progress,
            "user_index": 1,
            "category_name": "Account Management",
            "agent_index": 0
        },
        {
            "title": "Software installation request",
            "description": "Need Adobe Photoshop installed on my workstation",
            "content": "I need Adobe Photoshop CC installed on my computer for a project I'm working on. I have the license information from our IT department.",
            "priority": TicketPriority.low,
            "severity": TicketSeverity.low,
            "status": TicketStatus.open,
            "user_index": 2,
            "category_name": "Technical Support"
        },
        {
            "title": "VPN connection issues",
            "description": "Cannot connect to company VPN from home",
            "content": "I'm working from home and can't connect to the company VPN. I get an error message saying 'Connection timeout'. This worked fine last week.",
            "priority": TicketPriority.high,
            "severity": TicketSeverity.moderate,
            "status": TicketStatus.in_progress,
            "user_index": 0,
            "category_name": "Technical Support",
            "agent_index": 1
        },
        {
            "title": "How to use new project management tool?",
            "description": "Need training on the new project management software",
            "content": "Our department just got access to a new project management tool and I'm not sure how to use it. Are there any training materials or can someone show me the basics?",
            "priority": TicketPriority.low,
            "severity": TicketSeverity.info,
            "status": TicketStatus.closed,
            "user_index": 1,
            "category_name": "General Inquiry",
            "agent_index": 2
        }
    ]
    
    created_tickets = []
    
    for i, ticket_data in enumerate(tickets_data):
        # Find the category
        category = next((c for c in categories if c.name == ticket_data["category_name"]), None)
        if not category:
            print(f"Category not found: {ticket_data['category_name']}")
            continue
        
        # Find a subcategory for this category
        subcategory = next((s for s in subcategories if s.category_id == str(category.id)), None)
        if not subcategory:
            print(f"No subcategory found for category: {category.name}")
            continue
        
        # Get user
        if ticket_data["user_index"] >= len(regular_users):
            print(f"User index out of range: {ticket_data['user_index']}")
            continue
        user = regular_users[ticket_data["user_index"]]
        
        # Get agent if specified
        agent = None
        if "agent_index" in ticket_data and ticket_data["agent_index"] < len(agents):
            agent = agents[ticket_data["agent_index"]]
        
        # Create ticket
        # Create rich text content from HTML string
        rich_content = create_rich_text_from_html(ticket_data["content"])
        
        ticket = Ticket(
            title=ticket_data["title"],
            description=ticket_data["description"],
            content=rich_content,
            categoryId=category,
            subCategoryId=subcategory,
            userId=user,
            agentId=agent,
            status=ticket_data["status"],
            priority=ticket_data["priority"],
            severity=ticket_data["severity"],
            tagIds=[],
            createdAt=datetime.now(timezone.utc) - timedelta(days=i),  # Stagger creation dates
            updatedAt=datetime.now(timezone.utc) - timedelta(hours=i*2)
        )
        
        await ticket.insert()
        created_tickets.append(ticket)
        print(f"Created ticket: {ticket_data['title']}")
        
        # Add a comment if the ticket is in progress or closed
        if ticket_data["status"] in [TicketStatus.in_progress, TicketStatus.closed] and agent:
            comment_content = create_rich_text_from_html("Thank you for contacting support. I'm looking into this issue and will update you shortly.")
            comment = Comment(
                ticket=ticket,
                userId=agent,
                content=comment_content,
                createdAt=datetime.now(timezone.utc) - timedelta(hours=i*2-1)
            )
            await comment.insert()
            print(f"  Added comment to ticket: {ticket_data['title']}")
    
    return created_tickets

async def main():
    """Main seed data function"""
    print("Starting seed data creation...")
    
    # Initialize database
    await init_db()
    
    try:
        # Create demo data
        users = await create_demo_users()
        categories = await create_demo_categories()
        tags = await create_demo_tags()
        tickets = await create_demo_tickets(users, categories)
        
        print(f"\nSeed data creation completed!")
        print(f"Created {len(users)} users")
        print(f"Created {len(categories)} categories")
        print(f"Created {len(tags)} tags")
        print(f"Created {len(tickets)} tickets")
        
        print("\nDemo Login Credentials:")
        print("Regular Users:")
        print("  john.doe@company.com / password123")
        print("  jane.smith@company.com / password123")
        print("  mike.johnson@company.com / password123")
        print("\nAgents:")
        print("  sarah.wilson@company.com / password123")
        print("  david.brown@company.com / password123")
        print("  lisa.davis@company.com / password123")
        
    except Exception as e:
        print(f"Error creating seed data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())