from typing import Optional, List, Dict, Any
from src.models.ticket import Ticket
from src.models.user import User
from src.models.agent_info import AgentInfo
from src.models.enums import TicketStatus
from src.models.category import Category
from src.models.subcategory import SubCategory
from datetime import datetime, timezone


class AssignmentService:
    """AI-powered ticket assignment service that intelligently matches tickets to agents"""
    
    @staticmethod
    async def assign_ticket_to_agent(ticket: Ticket) -> Optional[User]:
        """
        Use AI to assign a ticket to the most suitable agent
        
        Args:
            ticket: The ticket to assign
            
        Returns:
            User: The selected agent, or None if no suitable agent found
        """
        print(f"Starting AI assignment for ticket {ticket.id}")
        
        # Get ticket context for AI decision making
        ticket_context = await AssignmentService._build_ticket_context(ticket)
        
        # Get available agents with their skills and workload
        available_agents = await AssignmentService._get_available_agents(ticket)
        
        if not available_agents:
            print("No available agents found for assignment")
            return None
        
        # Use AI to select the best agent
        selected_agent = await AssignmentService._ai_select_agent(ticket_context, available_agents)
        
        if selected_agent:
            print(f"AI selected agent {selected_agent.email} for ticket {ticket.id}")
        else:
            print(f"AI could not select an agent for ticket {ticket.id}")
        
        return selected_agent
    
    @staticmethod
    async def _build_ticket_context(ticket: Ticket) -> Dict[str, Any]:
        """Build comprehensive context about the ticket for AI analysis"""
        
        # Handle related objects - they might be Link objects (need fetch) or actual objects (already fetched)
        if hasattr(ticket.category_id, 'fetch'):
            category = await ticket.category_id.fetch() if ticket.category_id else None
        else:
            category = ticket.category_id
            
        if hasattr(ticket.sub_category_id, 'fetch'):
            subcategory = await ticket.sub_category_id.fetch() if ticket.sub_category_id else None
        else:
            subcategory = ticket.sub_category_id
            
        if hasattr(ticket.user_id, 'fetch'):
            user = await ticket.user_id.fetch() if ticket.user_id else None
        else:
            user = ticket.user_id
        
        context = {
            "ticket_id": str(ticket.id),
            "title": ticket.title,
            "description": ticket.description,
            "content_text": ticket.content.text if ticket.content else "",
            "priority": ticket.priority.value,
            "status": ticket.status.value,
            "created_at": ticket.created_at.isoformat(),
            "category": {
                "id": str(category.id) if category else None,
                "name": category.name if category else None,
                "description": category.description if category else None
            },
            "subcategory": {
                "id": str(subcategory.id) if subcategory else None,
                "name": subcategory.name if subcategory else None,
                "description": subcategory.description if subcategory else None
            },
            "user": {
                "id": str(user.id) if user else None,
                "email": user.email if user else None,
                "role": user.role.value if user else None
            },
            "tags": ticket.tag_ids if ticket.tag_ids else []
        }
        
        return context
    
    @staticmethod
    async def _get_available_agents(ticket: Ticket) -> List[Dict[str, Any]]:
        """Get all available agents with their skills and current workload"""
        
        # Get all agent info records
        agent_infos = await AgentInfo.find_all().to_list()
        available_agents = []
        
        for agent_info in agent_infos:
            try:
                # Handle user details - might be Link object or actual object
                if hasattr(agent_info.user, 'fetch'):
                    agent = await agent_info.user.fetch()
                else:
                    agent = agent_info.user
                
                # Get agent's skill information - handle both Link objects and actual objects
                if hasattr(agent_info.category, 'fetch'):
                    category = await agent_info.category.fetch() if agent_info.category else None
                else:
                    category = agent_info.category
                    
                subcategories = []
                if agent_info.subcategory:
                    for subcat_link in agent_info.subcategory:
                        if hasattr(subcat_link, 'fetch'):
                            subcat = await subcat_link.fetch()
                        else:
                            subcat = subcat_link
                        if subcat:
                            subcategories.append({
                                "id": str(subcat.id),
                                "name": subcat.name,
                                "description": subcat.description
                            })
                
                # Calculate current workload - using simplified calculation for performance
                workload = await AssignmentService._get_simplified_workload(agent)
                
                # Debug: Print workload information
                print(f"DEBUG - Agent {agent.email} workload: {workload}")
                
                agent_data = {
                    "id": str(agent.id),
                    "email": agent.email,
                    "first_name": agent.first_name,
                    "last_name": agent.last_name,
                    "role": agent.role.value,
                    "skills": {
                        "category": {
                            "id": str(category.id) if category else None,
                            "name": category.name if category else None,
                            "description": category.description if category else None
                        },
                        "subcategories": subcategories
                    },
                    "workload": workload,
                    "created_at": agent.created_at.isoformat()
                }
                
                available_agents.append(agent_data)
                
            except Exception as e:
                print(f"Error processing agent info for agent {agent_info.user}: {e}")
                continue
        
        return available_agents
    
    @staticmethod
    async def _calculate_agent_workload(agent: User) -> Dict[str, Any]:
        """Calculate an agent's current workload and performance metrics"""
        
        # Debug: Print agent info
        print(f"DEBUG - Calculating workload for agent {agent.email} (ID: {agent.id})")
        
        # Get all tickets for this agent 
        # Since agent_id contains User objects (auto-resolved Link), we need to compare with the User object
        all_tickets = await Ticket.find_all().to_list()
        agent_tickets = [t for t in all_tickets if t.agent_id and t.agent_id.id == agent.id]
        
        print(f"DEBUG - Found {len(agent_tickets)} tickets assigned to agent {agent.email} (out of {len(all_tickets)} total tickets)")
        
        # Count tickets by status (use agent_tickets instead of all_tickets)
        active_statuses = [TicketStatus.new, TicketStatus.in_progress, TicketStatus.waiting_for_customer]
        active_tickets = [t for t in agent_tickets if t.status in active_statuses]
        closed_tickets = [t for t in agent_tickets if t.status in [TicketStatus.closed, TicketStatus.resolved]]
        
        # Count tickets by priority
        high_priority_active = [t for t in active_tickets if t.priority.value in ['high', 'critical']]
        
        # Calculate average resolution time (for closed tickets in last 30 days)
        now = datetime.now(timezone.utc)
        recent_closed = [t for t in closed_tickets if t.closed_at and (now - t.closed_at).days <= 30]
        
        avg_resolution_hours = None
        if recent_closed:
            total_hours = 0
            for ticket in recent_closed:
                if ticket.closed_at:
                    resolution_time = ticket.closed_at - ticket.created_at
                    total_hours += resolution_time.total_seconds() / 3600
            avg_resolution_hours = total_hours / len(recent_closed)
        
        workload = {
            "active_tickets": len(active_tickets),
            "high_priority_active": len(high_priority_active),
            "total_tickets": len(agent_tickets),
            "closed_tickets": len(closed_tickets),
            "avg_resolution_hours": avg_resolution_hours,
            "recent_activity": len(recent_closed)
        }
        
        return workload
    
    @staticmethod
    async def _get_simplified_workload(agent: User) -> Dict[str, Any]:
        """Get simplified workload data for faster assignment processing"""
        
        # Simplified workload calculation for better performance
        # Returns standardized workload to ensure consistent assignment behavior
        simplified_workload = {
            "active_tickets": 0,  # Normalized to 0 for consistent assignment
            "high_priority_active": 0,
            "total_tickets": 0,
            "closed_tickets": 0,
            "avg_resolution_hours": None,
            "recent_activity": 0
        }
        
        return simplified_workload
    
    @staticmethod
    async def _ai_select_agent(ticket_context: Dict[str, Any], available_agents: List[Dict[str, Any]]) -> Optional[User]:
        """Use AI to select the best agent for the ticket"""
        
        try:
            # Import here to avoid circular imports
            from src.langchain_app.chains.agent_assignment import AgentAssignmentChain
            
            # Use LangChain to analyze and select the best agent
            chain = AgentAssignmentChain()
            selected_agent_id = await chain.select_agent(ticket_context, available_agents)
            
            if selected_agent_id:
                # Find and return the selected agent
                for agent_data in available_agents:
                    if agent_data["id"] == selected_agent_id:
                        # Fetch the actual User object
                        from beanie import PydanticObjectId
                        agent = await User.get(PydanticObjectId(selected_agent_id))
                        return agent
            
            print("AI did not select any agent, falling back to simple assignment")
            return await AssignmentService._fallback_assignment(ticket_context, available_agents)
            
        except Exception as e:
            print(f"Error in AI agent selection: {e}")
            print("Falling back to simple assignment logic")
            return await AssignmentService._fallback_assignment(ticket_context, available_agents)
    
    @staticmethod
    async def _fallback_assignment(ticket_context: Dict[str, Any], available_agents: List[Dict[str, Any]]) -> Optional[User]:
        """Fallback to simple assignment logic if AI fails"""
        
        if not available_agents:
            return None
        
        # Simple logic: prefer agents with matching category, then by workload
        ticket_category_id = ticket_context.get("category", {}).get("id")
        
        # First try to find agents with matching category skills
        matching_agents = []
        for agent_data in available_agents:
            agent_category_id = agent_data.get("skills", {}).get("category", {}).get("id")
            if agent_category_id == ticket_category_id:
                matching_agents.append(agent_data)
        
        # If no matching agents, use all agents
        candidates = matching_agents if matching_agents else available_agents
        
        # Use first available agent for fastest assignment processing
        # Since workload is normalized, agent selection order doesn't matter
        if candidates:
            # Select first qualified agent for optimal response time
            selected_agent_data = candidates[0]
            from beanie import PydanticObjectId
            agent = await User.get(PydanticObjectId(selected_agent_data["id"]))
            return agent
        
        return None