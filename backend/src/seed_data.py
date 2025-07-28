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
from src.models.article import Article
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
        await Article.delete_all()
        
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
            "name": "IT Support",
            "description": "Information Technology support and technical issues",
            "subcategories": [
                {"name": "Hardware Issues", "description": "Desktop, laptop, printer, and device problems"},
                {"name": "Software Issues", "description": "Application installation, updates, and troubleshooting"},
                {"name": "Network & Connectivity", "description": "VPN, WiFi, internet, and network access issues"},
                {"name": "Email & Communication", "description": "Email, chat, video conferencing, and communication tools"},
                {"name": "Security & Access", "description": "Password resets, account lockouts, and security incidents"}
            ]
        },
        {
            "name": "HR Support",
            "description": "Human Resources support for employee needs",
            "subcategories": [
                {"name": "Employee Onboarding", "description": "New employee setup and orientation"},
                {"name": "Benefits & Payroll", "description": "Health insurance, retirement, and payroll questions"},
                {"name": "Time Off & Leave", "description": "Vacation requests, sick leave, and time off policies"},
                {"name": "Training & Development", "description": "Professional development and training requests"},
                {"name": "Workplace Issues", "description": "HR concerns, policies, and workplace support"}
            ]
        },
        {
            "name": "Operations",
            "description": "General business operations and facilities support",
            "subcategories": [
                {"name": "Facilities & Office", "description": "Office space, equipment, and facility requests"},
                {"name": "Procurement & Supplies", "description": "Office supplies, equipment purchasing, and vendor requests"},
                {"name": "Travel & Expense", "description": "Business travel arrangements and expense reporting"},
                {"name": "Documentation", "description": "Process documentation, policy questions, and procedures"},
                {"name": "General Requests", "description": "Miscellaneous operational support and requests"}
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
        {"key": "team", "value": "frontend"},
        {"key": "team", "value": "backend"},
        {"key": "team", "value": "infrastructure"},
        {"key": "request_type", "value": "access"},
        {"key": "request_type", "value": "configuration"},
        {"key": "request_type", "value": "installation"},
        {"key": "platform", "value": "windows"},
        {"key": "platform", "value": "mac"},  
        {"key": "platform", "value": "mobile"},
        {"key": "business_unit", "value": "sales"},
        {"key": "business_unit", "value": "marketing"},
        {"key": "business_unit", "value": "engineering"},
        {"key": "impact", "value": "single_user"},
        {"key": "impact", "value": "team_wide"},
        {"key": "impact", "value": "company_wide"},
        {"key": "location", "value": "office"},
        {"key": "location", "value": "remote"},
        {"key": "location", "value": "hybrid"}
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
    
    # Comprehensive ticket templates for each category with rich HTML content
    ticket_templates = {
        "IT Support": [
            {
                "title": "Computer won't start after power outage",
                "description": "Desktop computer completely unresponsive after building power outage last night. No power lights, fans, or startup sounds when pressing power button. Urgent issue affecting client presentations scheduled for today. Already verified power cable connections and monitor functionality.",
                "content": "<h3>Issue Description</h3><p>I came into work this morning and my <strong>desktop computer won't start</strong> after the power outage last night.</p><h4>Steps I've tried:</h4><ul><li>Checked power cable - it's plugged in properly</li><li>Tested monitor - it's working fine</li><li>Pressed power button multiple times</li></ul><p><em>When I press the power button, nothing happens - no lights, no fan noise, nothing.</em></p><p>This is urgent as I have client presentations today.</p>",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.high
            },
            {
                "title": "VPN connection timeout from home office",
                "description": "Unable to establish VPN connection while working from home. Getting 'Connection timeout - Unable to reach VPN server' error message. Internet connection is stable and this worked properly last week. Already tried different servers and restarted equipment.",
                "content": "<h3>VPN Connection Issue</h3><p>I'm working from home and <strong>cannot connect to the company VPN</strong>.</p><h4>Error Details:</h4><blockquote><p>Error message: <em>'Connection timeout - Unable to reach VPN server'</em></p></blockquote><h4>Additional Information:</h4><ul><li>This worked fine last week</li><li>Internet connection is stable (50Mbps down/10Mbps up)</li><li>Tried different VPN servers in the client</li><li>Restarted router and computer</li></ul><p>Please help resolve this as soon as possible.</p>",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.medium
            },
            {
                "title": "Outlook crashes when opening PDF attachments",
                "description": "Microsoft Outlook crashes immediately when attempting to open PDF attachments. Issue started after latest Windows update. Only affects PDF files - Word documents open normally. Crashes cause application restart but attachments remain inaccessible.",
                "content": "<h3>Outlook Crash Issue</h3><p>Every time I try to open a <strong>PDF attachment in Outlook</strong>, the application crashes completely.</p><h4>Problem Details:</h4><ul><li>Started happening after the latest Windows update</li><li>Only affects PDF files (Word docs open fine)</li><li>Crash occurs immediately upon clicking attachment</li><li>Outlook restarts automatically but attachment doesn't open</li></ul><h4>System Info:</h4><p><strong>OS:</strong> Windows 11 Enterprise<br><strong>Outlook Version:</strong> Microsoft 365</p><p>This is affecting my daily workflow significantly.</p>",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.medium
            },
            {
                "title": "Shared printer offline - 3rd floor",
                "description": "HP LaserJet Pro printer on 3rd floor showing as offline across multiple computers. Printer display shows ready status but all print jobs remain stuck in queue. Issue started around 2 PM and affects entire department. Basic troubleshooting already attempted.",
                "content": "<h3>Printer Offline Issue</h3><p>The <strong>shared network printer on the 3rd floor</strong> (HP LaserJet Pro) is showing as offline.</p><h4>Affected Users:</h4><ul><li>Multiple colleagues in my department</li><li>Started around 2 PM today</li><li>Print jobs are stuck in queue</li></ul><h4>Troubleshooting Attempted:</h4><ol><li>Restarted my computer</li><li>Removed and re-added printer</li><li>Checked printer display (shows ready)</li></ol><p><em>Note: The printer appears to be powered on and ready, but all computers show it as offline.</em></p>",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.medium
            }
        ],
        "HR Support": [
            {
                "title": "Health insurance enrollment question",
                "description": "Requesting help with health insurance enrollment during current open enrollment period. Need clarification on plan differences, spouse addition eligibility, and enrollment deadlines. Family situation has changed requiring better coverage than current Plan C Basic.",
                "content": "<h3>Health Insurance Enrollment</h3><p>I need help with my <strong>health insurance enrollment</strong> during the current open enrollment period.</p><h4>Specific Questions:</h4><ul><li>What's the difference between Plan A and Plan B?</li><li>Can I add my spouse who just got laid off?</li><li>What's the deadline for making changes?</li></ul><h4>Current Situation:</h4><p>I'm currently on <em>Plan C (Basic)</em> but my family situation has changed and I need better coverage.</p><p>Could someone from HR call me or set up a meeting to discuss options?</p><p><strong>Best time to reach me:</strong> Mornings before 10 AM or after 3 PM</p>",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.low
            },
            {
                "title": "Maternity leave policy questions",
                "description": "Expecting baby in 3 months and need comprehensive information about company maternity leave policy. Questions about leave duration, pay structure, required paperwork, notification timeline, and potential work-from-home options before leave begins.",
                "content": "<h3>Maternity Leave Information Request</h3><p>I'm expecting a baby in <strong>3 months</strong> and need information about our maternity leave policy.</p><h4>Questions:</h4><ol><li>How much leave am I entitled to?</li><li>Is it paid or unpaid?</li><li>What paperwork do I need to complete?</li><li>When should I notify my manager officially?</li><li>Can I work from home part-time before the leave?</li></ol><h4>Current Status:</h4><ul><li><strong>Department:</strong> Marketing</li><li><strong>Employment Duration:</strong> 2.5 years</li><li><strong>Expected Due Date:</strong> March 15th</li></ul><p>Please let me know what steps I need to take and any forms I should fill out.</p>",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.low
            },
            {
                "title": "Professional development training request",
                "description": "Requesting approval for Digital Marketing Summit 2024 conference attendance in Chicago (April 10-12). Event cost $1,200 plus travel expenses. Manager has provided verbal approval. Need guidance on reimbursement forms and procedures.",
                "content": "<h3>Training & Development Request</h3><p>I would like to request approval for professional development training.</p><h4>Training Details:</h4><blockquote><p><strong>Event:</strong> Digital Marketing Summit 2024<br><strong>Date:</strong> April 10-12, 2024<br><strong>Location:</strong> Chicago, IL<br><strong>Cost:</strong> $1,200 (registration) + travel expenses</p></blockquote><h4>Business Justification:</h4><ul><li>Directly relevant to my role in digital marketing</li><li>Latest trends in social media advertising</li><li>Networking opportunities with industry leaders</li><li>Will share learnings with the team</li></ul><h4>Manager Approval:</h4><p>My manager <em>Sarah Johnson</em> has verbally approved this request.</p><p>Please let me know what forms I need to complete for reimbursement.</p>",
                "priority": TicketPriority.low,
                "severity": TicketSeverity.low
            }
        ],
        "Operations": [
            {
                "title": "Office supply order for Q1",
                "description": "Marketing department quarterly office supply order for Q1. Need bulk quantities of copy paper, ink cartridges, notebooks, pens, and sticky notes. Prefer delivery first week of January to 2nd floor marketing office. Standard supplier and quantities listed.",
                "content": "<h3>Quarterly Office Supply Request</h3><p>Our <strong>marketing department</strong> needs to place our Q1 office supply order.</p><h4>Items Needed:</h4><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Item</th><th>Quantity</th><th>Notes</th></tr><tr><td>Copy paper (reams)</td><td>20</td><td>White, 20lb</td></tr><tr><td>Ink cartridges</td><td>8</td><td>Canon 245/246 combo</td></tr><tr><td>Notebooks</td><td>15</td><td>Spiral-bound, college ruled</td></tr><tr><td>Pens (blue)</td><td>50</td><td>Bic Round Stic</td></tr><tr><td>Sticky notes</td><td>20 pads</td><td>3x3 yellow</td></tr></table><h4>Delivery:</h4><p><strong>Preferred delivery date:</strong> First week of January<br><strong>Delivery location:</strong> Marketing office, 2nd floor<br><strong>Contact:</strong> me or my assistant Jennifer</p><p>Please confirm the order and provide estimated delivery date.</p>",
                "priority": TicketPriority.low,
                "severity": TicketSeverity.low
            },
            {
                "title": "Business travel booking assistance",
                "description": "Requesting assistance with business travel arrangements for important client meeting in San Francisco (February 15-17). Need flight booking, hotel near Financial District, and ground transportation. Meeting with TechCorpSolutions on February 16th at 2 PM.",
                "content": "<h3>Business Travel Request</h3><p>I need assistance booking <strong>business travel</strong> for an important client meeting.</p><h4>Travel Details:</h4><ul><li><strong>Destination:</strong> San Francisco, CA</li><li><strong>Dates:</strong> February 15-17, 2024</li><li><strong>Departure:</strong> Monday morning (prefer 7-9 AM flight)</li><li><strong>Return:</strong> Wednesday evening (after 4 PM)</li></ul><h4>Requirements:</h4><ol><li><strong>Flight:</strong> Economy class, aisle seat preferred</li><li><strong>Hotel:</strong> Near Financial District, 3+ stars</li><li><strong>Ground Transportation:</strong> Airport shuttle or rideshare</li></ol><h4>Meeting Information:</h4><blockquote><p><strong>Client:</strong> TechCorpSolutions<br><strong>Meeting Date:</strong> Tuesday, Feb 16th at 2 PM<br><strong>Location:</strong> 123 Market Street, San Francisco</p></blockquote><p>Please provide flight options and hotel recommendations within our travel policy.</p>",
                "priority": TicketPriority.medium,
                "severity": TicketSeverity.low
            },
            {
                "title": "New employee desk setup request",
                "description": "New software developer Alex Thompson starting Monday January 22nd. Need complete workstation setup including MacBook Pro 16-inch, 27-inch 4K monitor, wireless peripherals, and desk phone. Desk D-47 confirmed with facilities. Setup must be ready by Friday for testing.",
                "content": "<h3>New Employee Setup</h3><p>We have a <strong>new team member starting next Monday</strong> and need their workstation prepared.</p><h4>Employee Information:</h4><ul><li><strong>Name:</strong> Alex Thompson</li><li><strong>Department:</strong> Software Development</li><li><strong>Start Date:</strong> Monday, January 22nd</li><li><strong>Manager:</strong> David Rodriguez</li></ul><h4>Equipment Needed:</h4><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Item</th><th>Specifications</th><th>Priority</th></tr><tr><td>Laptop</td><td>MacBook Pro 16' (Development spec)</td><td>High</td></tr><tr><td>Monitor</td><td>27' 4K display</td><td>High</td></tr><tr><td>Keyboard/Mouse</td><td>Wireless Apple set</td><td>Medium</td></tr><tr><td>Desk Phone</td><td>Standard office phone</td><td>Low</td></tr></table><h4>Location:</h4><p><strong>Desk Location:</strong> Open office area, Development section<br><strong>Desk Number:</strong> D-47 (confirmed with facilities)</p><p>Please confirm everything will be ready by Friday so we can test the setup.</p>",
                "priority": TicketPriority.high,
                "severity": TicketSeverity.medium
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
            
            # Assign agent to ALL tickets (including new ones for automatic assignment)
            agent = None
            try:
                # Get all agent infos and find ones that match this category
                all_agent_infos = await AgentInfo.find_all().to_list()
                matching_agent_infos = []
                
                for agent_info in all_agent_infos:
                    # Fetch the category link to compare
                    agent_category = await agent_info.category.fetch()
                    if str(agent_category.id) == str(category.id):
                        matching_agent_infos.append(agent_info)
                
                if matching_agent_infos:
                    agent_info = matching_agent_infos[ticket_counter % len(matching_agent_infos)]
                    agent = await agent_info.user.fetch()
            except Exception as e:
                print(f"Warning: Could not assign agent for ticket {template['title']}: {e}")
                # Try to assign any available agent as fallback
                agents_list = [u for u in users if u.role == UserRole.agent]
                if agents_list:
                    agent = agents_list[ticket_counter % len(agents_list)]
            
            # Create rich text content
            rich_content = create_rich_text_from_html(template["content"])
            
            # Create ticket
            days_ago = ticket_counter // 3  # Stagger creation dates
            ticket = Ticket(
                title=template["title"],
                description=template["description"],
                content=rich_content,
                category_id=category,
                sub_category_id=subcategory,
                user_id=user,
                agent_id=agent,
                status=status,
                priority=template["priority"],
                severity=template["severity"],
                tag_ids=[],
                created_at=datetime.now(timezone.utc) - timedelta(days=days_ago),
                updated_at=datetime.now(timezone.utc) - timedelta(hours=ticket_counter*2)
            )
            
            # Set closed_at for closed/resolved tickets
            if status in [TicketStatus.closed, TicketStatus.resolved]:
                ticket.closed_at = datetime.now(timezone.utc) - timedelta(hours=ticket_counter)
            
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
                    user_id=agent,
                    content=comment_content,
                    created_at=datetime.now(timezone.utc) - timedelta(hours=ticket_counter*2-1)
                )
                await comment.insert()
                print(f"  Added comment to ticket: {template['title']}")
            
            ticket_counter += 1
    
    print(f"Created {len(created_tickets)} tickets total")
    
    # Verify all agents have at least one assigned ticket
    for agent in agents:
        assigned_count = len([t for t in created_tickets if t.agent_id and str(t.agent_id.id) == str(agent.id)])
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
            "category_name": "IT Support",
            "subcategory_names": ["Hardware Issues", "Software Issues", "Network & Connectivity"]
        },
        {
            "email": "david.brown@company.com", 
            "category_name": "HR Support",
            "subcategory_names": ["Employee Onboarding", "Benefits & Payroll", "Training & Development"]
        },
        {
            "email": "lisa.davis@company.com",
            "category_name": "Operations", 
            "subcategory_names": ["Facilities & Office", "Procurement & Supplies", "Travel & Expense"]
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

async def create_demo_articles(categories):
    """Create demo knowledge base articles for each category"""
    print("Creating demo knowledge base articles...")
    
    try:
        # Get subcategories
        subcategories = await SubCategory.find_all().to_list()
        if not subcategories:
            print("No subcategories found, skipping article creation")
            return []
    except Exception as e:
        print(f"ERROR in article subcategory fetching: {e}")
        return []
    
    # Article templates for each category
    article_templates = {
        "IT Support": [
            {
                "title": "How to Reset Your Password",
                "content": "<h2>Password Reset Guide</h2><p>Follow these steps to reset your password:</p><ol><li><strong>Visit the login page</strong> and click 'Forgot Password'</li><li><strong>Enter your email address</strong> in the reset form</li><li><strong>Check your email</strong> for the reset link (may take 5-10 minutes)</li><li><strong>Click the reset link</strong> and create a new password</li><li><strong>Log in</strong> with your new password</li></ol><h3>Password Requirements</h3><ul><li>At least 8 characters long</li><li>Must contain uppercase and lowercase letters</li><li>Must include at least one number</li><li>Must have at least one special character (!@#$%^&*)</li></ul><p><em>Note: If you don't receive the reset email, check your spam folder or contact IT support.</em></p>",
                "subcategory_name": "Security & Access"
            },
            {
                "title": "VPN Setup and Troubleshooting",
                "content": "<h2>VPN Configuration Guide</h2><h3>Initial Setup</h3><ol><li><strong>Download</strong> the company VPN client from the IT portal</li><li><strong>Install</strong> the software following the setup wizard</li><li><strong>Import</strong> your configuration file (sent via email)</li><li><strong>Enter</strong> your network credentials</li><li><strong>Connect</strong> and verify your connection</li></ol><h3>Common Issues and Solutions</h3><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Problem</th><th>Solution</th></tr><tr><td>Connection timeout</td><td>Try different server locations</td></tr><tr><td>Authentication failed</td><td>Verify username and password</td></tr><tr><td>Slow connection</td><td>Switch to a closer server</td></tr><tr><td>Cannot access company resources</td><td>Check split tunneling settings</td></tr></table><p><strong>Still having issues?</strong> Contact IT support with your error message and system details.</p>",
                "subcategory_name": "Network & Connectivity"
            },
            {
                "title": "Common Software Installation Issues",
                "content": "<h2>Software Installation Troubleshooting</h2><p>This guide covers common software installation problems and their solutions.</p><h3>Before Installing</h3><ul><li>Check system requirements</li><li>Ensure you have administrator privileges</li><li>Close all running applications</li><li>Temporarily disable antivirus</li></ul><h3>Common Error Messages</h3><h4>\"Access Denied\" or \"Permission Error\"</h4><p>Right-click the installer and select <strong>\"Run as Administrator\"</strong></p><h4>\"Another version is already installed\"</h4><ol><li>Go to <strong>Control Panel > Programs</strong></li><li>Uninstall the existing version</li><li>Restart your computer</li><li>Run the new installer</li></ol><h4>\"Corrupted installer\" or \"Download Error\"</h4><ul><li>Download the installer again</li><li>Check your internet connection</li><li>Scan the file for viruses</li></ul><p><em>If problems persist, contact IT support with the specific error message and software name.</em></p>",
                "subcategory_name": "Software Issues"
            }
        ],
        "HR Support": [
            {
                "title": "Employee Benefits Overview",
                "content": "<h2>Complete Benefits Guide</h2><p>Welcome to your comprehensive benefits package overview.</p><h3>Health Insurance</h3><ul><li><strong>Plan A (Basic):</strong> $150/month premium, $2,000 deductible</li><li><strong>Plan B (Standard):</strong> $250/month premium, $1,000 deductible</li><li><strong>Plan C (Premium):</strong> $350/month premium, $500 deductible</li></ul><h3>Retirement Plans</h3><p>We offer a <strong>401(k) plan</strong> with company matching:</p><ul><li>Company matches 50% up to 6% of your salary</li><li>Immediate vesting for all contributions</li><li>Multiple investment options available</li></ul><h3>Time Off Policies</h3><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Benefit</th><th>Amount</th><th>Notes</th></tr><tr><td>Vacation Days</td><td>15-25 days</td><td>Based on years of service</td></tr><tr><td>Sick Leave</td><td>10 days</td><td>Per calendar year</td></tr><tr><td>Personal Days</td><td>3 days</td><td>Use for any reason</td></tr></table><p><strong>Questions?</strong> Contact HR to schedule a benefits consultation.</p>",
                "subcategory_name": "Benefits & Payroll"
            },
            {
                "title": "New Employee Onboarding Checklist",
                "content": "<h2>Welcome to the Team!</h2><p>Here's your complete onboarding checklist to ensure a smooth start.</p><h3>First Day Tasks</h3><ol><li><strong>Check in with HR</strong> at 9:00 AM (Front desk)</li><li><strong>Complete paperwork:</strong><ul><li>I-9 Employment Eligibility Verification</li><li>W-4 Tax Withholding Form</li><li>Benefits enrollment forms</li><li>Emergency contact information</li></ul></li><li><strong>Receive your equipment:</strong><ul><li>Laptop and charger</li><li>Phone (if applicable)</li><li>ID badge and office keys</li><li>Welcome packet</li></ul></li><li><strong>Meet your manager</strong> for orientation</li><li><strong>Tour the facility</strong> and find key locations</li></ol><h3>First Week Goals</h3><ul><li>Complete mandatory training modules</li><li>Set up your workspace</li><li>Meet your team members</li><li>Review job expectations</li><li>Schedule one-on-one with your manager</li></ul><p><strong>Need help?</strong> Your HR buddy is here to assist with any questions!</p>",
                "subcategory_name": "Employee Onboarding"
            },
            {
                "title": "Professional Development Opportunities",
                "content": "<h2>Grow Your Career</h2><p>We're committed to your professional growth. Here are available development opportunities:</p><h3>Internal Training Programs</h3><ul><li><strong>Leadership Development:</strong> 6-month program for managers</li><li><strong>Technical Skills:</strong> Monthly workshops on industry tools</li><li><strong>Soft Skills:</strong> Communication, time management, teamwork</li><li><strong>Compliance Training:</strong> Required annual certifications</li></ul><h3>External Education Support</h3><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Type</th><th>Annual Budget</th><th>Requirements</th></tr><tr><td>Conferences</td><td>$2,000</td><td>Job-related, manager approval</td></tr><tr><td>Online Courses</td><td>$1,000</td><td>Skills assessment required</td></tr><tr><td>Certifications</td><td>$1,500</td><td>Must maintain certification</td></tr></table><h3>How to Request Training</h3><ol><li>Discuss with your manager during review</li><li>Submit training request form</li><li>Get manager and HR approval</li><li>Complete the training</li><li>Share learnings with your team</li></ol><p><em>Remember: Training budget resets each fiscal year (July 1st).</em></p>",
                "subcategory_name": "Training & Development"
            }
        ],
        "Operations": [
            {
                "title": "Office Supply Ordering Process",
                "content": "<h2>Supply Ordering Made Simple</h2><p>Follow this guide to order office supplies efficiently.</p><h3>Standard Supply Categories</h3><ul><li><strong>Paper Products:</strong> Copy paper, notebooks, sticky notes</li><li><strong>Writing Supplies:</strong> Pens, pencils, markers, highlighters</li><li><strong>Desk Supplies:</strong> Staplers, paper clips, folders, binders</li><li><strong>Technology:</strong> Batteries, cables, cleaning supplies</li></ul><h3>Ordering Process</h3><ol><li><strong>Check inventory</strong> - Order when supplies are 25% remaining</li><li><strong>Use the supply portal</strong> - Access via company intranet</li><li><strong>Select items</strong> from approved vendor catalog</li><li><strong>Add to cart</strong> and specify delivery details</li><li><strong>Submit for approval</strong> (automatic for orders under $500)</li></ol><h3>Delivery Information</h3><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Order Amount</th><th>Processing Time</th><th>Delivery Method</th></tr><tr><td>Under $100</td><td>3-5 business days</td><td>Standard shipping</td></tr><tr><td>$100-$500</td><td>2-3 business days</td><td>Priority shipping</td></tr><tr><td>Over $500</td><td>5-7 business days</td><td>Requires approval</td></tr></table><p><strong>Questions?</strong> Contact the Operations team for assistance.</p>",
                "subcategory_name": "Procurement & Supplies"
            },
            {
                "title": "Business Travel Guidelines",
                "content": "<h2>Business Travel Policy</h2><p>Everything you need to know about company travel arrangements.</p><h3>Pre-Travel Requirements</h3><ul><li><strong>Travel approval</strong> from your manager (2 weeks advance notice)</li><li><strong>Business justification</strong> for the trip</li><li><strong>Budget approval</strong> for estimated expenses</li><li><strong>Travel insurance</strong> notification (automatic for international travel)</li></ul><h3>Booking Guidelines</h3><h4>Flights</h4><ul><li>Book economy class for flights under 4 hours</li><li>Business class approved for flights over 6 hours</li><li>Use preferred airline partners when possible</li><li>Book at least 2 weeks in advance</li></ul><h4>Hotels</h4><ul><li>3-4 star hotels in business districts</li><li>Maximum $200/night in major cities</li><li>Choose hotels with business amenities</li></ul><h3>Expense Reporting</h3><ol><li><strong>Keep all receipts</strong> (required for expenses over $25)</li><li><strong>Submit within 30 days</strong> of trip completion</li><li><strong>Use expense app</strong> for real-time tracking</li><li><strong>Include business purpose</strong> for each expense</li></ol><p><em>International travel requires additional documentation and approvals.</em></p>",
                "subcategory_name": "Travel & Expense"
            },
            {
                "title": "Facility Maintenance and Requests",
                "content": "<h2>Facility Services Guide</h2><p>How to request maintenance and facility services.</p><h3>Common Facility Requests</h3><ul><li><strong>Office Maintenance:</strong> Lighting, HVAC, plumbing issues</li><li><strong>Workspace Setup:</strong> Desk moves, equipment installation</li><li><strong>Cleaning Services:</strong> Special cleaning, carpet maintenance</li><li><strong>Security:</strong> Key cards, access requests, parking</li></ul><h3>How to Submit Requests</h3><ol><li><strong>Use the facility portal</strong> or call the main number</li><li><strong>Provide detailed description</strong> of the issue/request</li><li><strong>Include location</strong> (building, floor, room number)</li><li><strong>Specify urgency level</strong> (emergency, urgent, routine)</li><li><strong>Add photos</strong> if helpful</li></ol><h3>Response Times</h3><table border='1' style='border-collapse: collapse; width: 100%;'><tr><th>Priority</th><th>Response Time</th><th>Examples</th></tr><tr><td>Emergency</td><td>Within 1 hour</td><td>Safety hazards, security issues</td></tr><tr><td>Urgent</td><td>Same business day</td><td>HVAC problems, plumbing leaks</td></tr><tr><td>Routine</td><td>3-5 business days</td><td>Light bulbs, minor repairs</td></tr></table><h3>After Hours Emergencies</h3><p>For true emergencies outside business hours:</p><ul><li><strong>Security issues:</strong> Call building security</li><li><strong>Safety hazards:</strong> Call emergency services if needed</li><li><strong>Facility emergencies:</strong> Use the after-hours number</li></ul>",
                "subcategory_name": "Facilities & Office"
            }
        ]
    }
    
    created_articles = []
    
    for category in categories:
        if category.name not in article_templates:
            continue
            
        templates = article_templates[category.name]
        
        for template in templates:
            # Find the matching subcategory
            subcategory = None
            for subcat in subcategories:
                if (str(subcat.category.ref.id) == str(category.id) and 
                    subcat.name == template["subcategory_name"]):
                    subcategory = subcat
                    break
            
            if not subcategory:
                print(f"Subcategory '{template['subcategory_name']}' not found for category '{category.name}'")
                continue
            
            # Create rich text content
            rich_content = create_rich_text_from_html(template["content"])
            
            # Create article
            article = Article(
                title=template["title"],
                content=rich_content,
                category_id=category,
                subcategory_id=subcategory,
                tags=[],
                vector_ids=[]
            )
            
            await article.insert()
            created_articles.append(article)
            print(f"Created article: {template['title']} (Category: {category.name})")
    
    return created_articles

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
        
        print("\n=== CREATING KNOWLEDGE BASE ARTICLES ===")
        articles = await create_demo_articles(categories)
        print(f"✓ Created {len(articles)} knowledge base articles")
        
        print("\n=== CREATING TICKETS ===")
        tickets = await create_demo_tickets(users, categories)
        print(f"✓ Created {len(tickets)} tickets")
        
        print(f"\nSeed data creation completed!")
        print(f"Created {len(users)} users")
        print(f"Created {len(categories)} categories")
        print(f"Created {len(agent_infos)} agent info records")
        print(f"Created {len(tags)} tags")
        print(f"Created {len(articles)} knowledge base articles")
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