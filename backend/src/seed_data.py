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
from src.models.agent_info import AgentInfo
from src.models.enums import UserRole, TicketStatus, TicketPriority, TicketSeverity
from src.models.rich_text import create_rich_text_from_html
from src.utils.security import hash_password
from src.db.init_db import init_db

async def clear_database():
    """Clear all collections for fresh start (development only)"""
    print("Clearing database for fresh start...")
    
    try:
        # Clear all collections
        await User.delete_all()
        await Category.delete_all() 
        await SubCategory.delete_all()
        await Tag.delete_all()
        await Ticket.delete_all()
        await Comment.delete_all()
        await AgentInfo.delete_all()
        
        print("Database cleared successfully!")
    except Exception as e:
        print(f"Error clearing database: {e}")

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
        tag = Tag(
            key=tag_data["key"],
            value=tag_data["value"]
        )
        await tag.insert()
        created_tags.append(tag)
        print(f"Created tag: {tag_data['key']}:{tag_data['value']}")
    
    return created_tags

async def create_demo_tickets(users, categories):
    """Create comprehensive demo tickets ensuring all users have tickets and all agents have assignments"""
    print("Creating comprehensive demo tickets...")
    
    try:
        # Get subcategories
        print("Fetching subcategories for tickets...")
        subcategories = await SubCategory.find_all().to_list()
        print(f"Found {len(subcategories)} subcategories for tickets")
        
        # Skip fetch_link - we'll access category by ID directly
        print("Subcategories loaded successfully for tickets (category links will be resolved by ID)")
        
    except Exception as e:
        print(f"ERROR in ticket subcategory fetching: {e}")
        import traceback
        traceback.print_exc()
        return []
    if not subcategories:
        print("No subcategories found, skipping ticket creation")
        return []
    
    # Filter users and agents
    regular_users = [u for u in users if u.role == UserRole.user]
    agents = [u for u in users if u.role == UserRole.agent]
    
    if not regular_users or not categories:
        print("Missing users or categories, skipping ticket creation")
        return []
    
    # Comprehensive ticket templates for each category
    ticket_templates = {
        "Technical Support": [
            {
                "title": "Computer won't start",
                "description": "Desktop computer power issues",
                "content": "I came into work this morning and my computer won't start. I've checked the power cable and it's plugged in properly. The monitor is working fine. When I press the power button, nothing happens - no lights, no fan noise, nothing.",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.high
            },
            {
                "title": "Software installation request",
                "description": "Need Adobe Photoshop installed on workstation",
                "content": "I need Adobe Photoshop CC installed on my computer for a project I'm working on. I have the license information from our IT department.",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.low
            },
            {
                "title": "VPN connection issues",
                "description": "Cannot connect to company VPN from home",
                "content": "I'm working from home and can't connect to the company VPN. I get an error message saying 'Connection timeout'. This worked fine last week.",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.moderate
            },
            {
                "title": "Printer not responding",
                "description": "Network printer shows offline status",
                "content": "The shared network printer on the 3rd floor is showing as offline. I've tried restarting my computer but it still won't print. Other colleagues are having the same issue.",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.moderate
            },
            {
                "title": "Email client crashes",
                "description": "Outlook keeps crashing when opening attachments",
                "content": "Every time I try to open a PDF attachment in Outlook, the application crashes. This started happening after the latest Windows update. I've tried restarting but the problem persists.",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.moderate
            }
        ],
        "Account Management": [
            {
                "title": "Password reset request",
                "description": "Forgot password and reset link not working",
                "content": "I can't remember my password and the password reset link in the email isn't working. Can someone help me reset my password manually?",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.low
            },
            {
                "title": "Account locked after multiple login attempts",
                "description": "Unable to access system due to locked account",
                "content": "My account got locked after I tried to log in with my old password multiple times. I need to access the system urgently for a client presentation.",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.moderate
            },
            {
                "title": "Permission request for shared folder",
                "description": "Need access to finance department shared folder",
                "content": "I've been transferred to the finance team and need access to the shared folder /Finance/Reports. My manager has approved this access request.",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.low
            },
            {
                "title": "Two-factor authentication issues",
                "description": "2FA app not generating correct codes",
                "content": "My authenticator app seems to be out of sync. The codes it generates are not being accepted by the system. I've tried syncing the time but it's still not working.",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.moderate
            }
        ],
        "General Inquiry": [
            {
                "title": "How to use new project management tool?",
                "description": "Need training on new project management software",
                "content": "Our department just got access to a new project management tool and I'm not sure how to use it. Are there any training materials or can someone show me the basics?",
                "priority": TicketPriority.low,
                "severity": TicketSeverity.info
            },
            {
                "title": "Request for software license",
                "description": "Need license for data analysis software",
                "content": "I need a license for SPSS software for data analysis work. What's the process to request this and how long does it typically take?",
                "priority": TicketPriority.low,
                "severity": TicketSeverity.info
            },
            {
                "title": "Office equipment request",
                "description": "Need ergonomic keyboard and mouse",
                "content": "I've been experiencing wrist pain and would like to request an ergonomic keyboard and mouse. Is this something IT can help with or should I contact HR?",
                "priority": TicketPriority.low,
                "severity": TicketSeverity.low
            },
            {
                "title": "Company policy clarification",
                "description": "Questions about remote work policy",
                "content": "I have some questions about the new remote work policy. Specifically, what are the requirements for home office setup and internet speed?",
                "priority": TicketPriority.low,
                "severity": TicketSeverity.info
            }
        ]
    }
    
    created_tickets = []
    ticket_counter = 0
    
    # Create tickets for each user (ensuring every user has at least one ticket)
    for user_idx, user in enumerate(regular_users):
        # Each user gets 2-3 tickets from different categories
        user_ticket_count = 2 + (user_idx % 2)  # 2 or 3 tickets per user
        
        for ticket_idx in range(user_ticket_count):
            # Cycle through categories to ensure variety
            category_names = list(ticket_templates.keys())
            category_name = category_names[ticket_counter % len(category_names)]
            category = next((c for c in categories if c.name == category_name), None)
            
            if not category:
                continue
            
            # Find a subcategory for this category
            subcategory = None
            for subcat in subcategories:
                # Access the Link object's ref_id (the actual ObjectId)
                if str(subcat.category.ref.id) == str(category.id):
                    subcategory = subcat
                    break
            if not subcategory:
                continue
            
            # Get ticket template
            templates = ticket_templates[category_name]
            template = templates[ticket_counter % len(templates)]
            
            # Determine status and agent assignment
            statuses = [TicketStatus.new, TicketStatus.in_progress, TicketStatus.waiting_for_customer, 
                       TicketStatus.waiting_for_agent, TicketStatus.resolved, TicketStatus.closed]
            status = statuses[ticket_counter % len(statuses)]
            
            # Assign agent if not 'new' status
            agent = None
            if status != TicketStatus.new:
                # Find agent with matching category skills
                agent_infos = await AgentInfo.find(AgentInfo.category.id == str(category.id)).to_list()
                if agent_infos:
                    agent_info = agent_infos[ticket_counter % len(agent_infos)]
                    agent = await agent_info.user.fetch()
            
            # Create rich text content
            rich_content = create_rich_text_from_html(template["content"])
            
            # Create ticket
            days_ago = ticket_counter // 3  # Stagger creation dates
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
                createdAt=datetime.now(timezone.utc) - timedelta(days=days_ago),
                updatedAt=datetime.now(timezone.utc) - timedelta(hours=ticket_counter*2)
            )
            
            # Set closedAt for closed/resolved tickets
            if status in [TicketStatus.closed, TicketStatus.resolved]:
                ticket.closedAt = datetime.now(timezone.utc) - timedelta(hours=ticket_counter)
            
            await ticket.insert()
            created_tickets.append(ticket)
            print(f"Created ticket #{ticket_counter + 1}: {template['title']} (User: {user.email}, Status: {status}, Agent: {agent.email if agent else 'Unassigned'})")
            
            # Add a comment if the ticket has an agent
            if agent and status in [TicketStatus.in_progress, TicketStatus.waiting_for_customer, TicketStatus.resolved, TicketStatus.closed]:
                comment_texts = [
                    "Thank you for contacting support. I'm looking into this issue and will update you shortly.",
                    "I've reviewed your request and am working on a solution. I'll have an update for you soon.",
                    "This appears to be a common issue. Let me walk you through the solution.",
                    "I've escalated this to our technical team for further investigation.",
                    "The issue has been resolved. Please test and let me know if you experience any further problems."
                ]
                comment_text = comment_texts[ticket_counter % len(comment_texts)]
                comment_content = create_rich_text_from_html(comment_text)
                
                comment = Comment(
                    ticket=ticket,
                    userId=agent,
                    content=comment_content,
                    createdAt=datetime.now(timezone.utc) - timedelta(hours=ticket_counter*2-1)
                )
                await comment.insert()
                print(f"  Added comment to ticket: {template['title']}")
            
            ticket_counter += 1
    
    print(f"Created {len(created_tickets)} tickets total")
    
    # Verify all agents have at least one assigned ticket
    for agent in agents:
        assigned_count = len([t for t in created_tickets if t.agentId and str(t.agentId.id) == str(agent.id)])
        print(f"Agent {agent.email} has {assigned_count} assigned tickets")
    
    return created_tickets

async def create_demo_agent_info(users, categories):
    """Create agent info records for demo agents"""
    print("Creating demo agent info...")
    
    try:
        # Get subcategories
        print("Fetching subcategories...")
        subcategories = await SubCategory.find_all().to_list()
        print(f"Found {len(subcategories)} subcategories")
        
        # Skip fetch_link - we'll access category by ID directly
        print("Subcategories loaded successfully (category links will be resolved by ID)")
        
    except Exception as e:
        print(f"ERROR in subcategory fetching: {e}")
        import traceback
        traceback.print_exc()
        return []
    if not subcategories:
        print("No subcategories found, skipping agent info creation")
        return []
    
    # Filter agents
    agents = [u for u in users if u.role == UserRole.agent]
    if not agents or not categories:
        print("Missing agents or categories, skipping agent info creation")
        return []
    
    # Agent skill assignments
    agent_skills = [
        {
            "email": "sarah.wilson@company.com",
            "category_name": "Technical Support",
            "subcategory_names": ["Hardware Issues", "Software Issues"]
        },
        {
            "email": "david.brown@company.com", 
            "category_name": "Account Management",
            "subcategory_names": ["Password Reset", "Access Permissions"]
        },
        {
            "email": "lisa.davis@company.com",
            "category_name": "General Inquiry", 
            "subcategory_names": ["How-to Questions", "Feature Requests"]
        }
    ]
    
    created_agent_infos = []
    
    for skill_data in agent_skills:
        # Find the agent
        agent = next((a for a in agents if a.email == skill_data["email"]), None)
        if not agent:
            print(f"Agent not found: {skill_data['email']}")
            continue
        
        # Check if agent info already exists
        existing = await AgentInfo.find_one(AgentInfo.user.id == str(agent.id))
        if existing:
            print(f"Agent info already exists for: {skill_data['email']}")
            continue
        
        # Find the category
        category = next((c for c in categories if c.name == skill_data["category_name"]), None)
        if not category:
            print(f"Category not found: {skill_data['category_name']}")
            continue
        
        # Find subcategories for this category
        agent_subcategories = []
        for subcat in subcategories:
            # Check if this subcategory belongs to the agent's category
            # Access the Link object's ref_id (the actual ObjectId)
            if str(subcat.category.ref.id) == str(category.id):
                agent_subcategories.append(subcat)
                if len(agent_subcategories) >= 2:  # Limit to 2 subcategories per agent
                    break
        
        # Create agent info
        agent_info = AgentInfo(
            user=agent,
            category=category,
            subcategory=agent_subcategories if agent_subcategories else None
        )
        
        await agent_info.insert()
        created_agent_infos.append(agent_info)
        print(f"Created agent info for {skill_data['email']}: {skill_data['category_name']} with {len(agent_subcategories)} subcategories")
    
    return created_agent_infos

async def main():
    """Main seed data function"""
    print("Starting seed data creation...")
    
    # Initialize database
    await init_db()
    
    try:
        # Clear existing data for fresh start (development only)
        await clear_database()
        
        # Create demo data in order
        print("=== CREATING CATEGORIES ===")
        categories = await create_demo_categories()
        print(f"✓ Created {len(categories)} categories")
        
        print("\n=== CREATING USERS ===")
        users = await create_demo_users()
        print(f"✓ Created {len(users)} users")
        
        print("\n=== CREATING AGENT INFO ===")
        agent_infos = await create_demo_agent_info(users, categories)
        print(f"✓ Created {len(agent_infos)} agent info records")
        
        print("\n=== CREATING TAGS ===")
        tags = await create_demo_tags()
        print(f"✓ Created {len(tags)} tags")
        
        print("\n=== CREATING TICKETS ===")
        tickets = await create_demo_tickets(users, categories)
        print(f"✓ Created {len(tickets)} tickets")
        
        print(f"\nSeed data creation completed!")
        print(f"Created {len(users)} users")
        print(f"Created {len(categories)} categories")
        print(f"Created {len(agent_infos)} agent info records")
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