from src.langchain_app.config.model_config import llm
from typing import Dict, List, Any, Optional
import json

class AgentAssignmentChain:
    """LangChain-based agent assignment that analyzes tickets and selects the best agent"""
    
    def __init__(self):
        """Initialize the LangChain components"""
        self.llm = llm
    
    async def select_agent(self, ticket_context: Dict[str, Any], available_agents: List[Dict[str, Any]]) -> Optional[str]:
        """
        Use AI to select the best agent for a ticket
        
        Args:
            ticket_context: Dict containing ticket information
            available_agents: List of available agents with their skills and workload
            
        Returns:
            str: Selected agent ID, or None if no suitable agent found
        """
        
        try:
            # Format agent information for the prompt
            agents_info = self._format_agents_for_prompt(available_agents)
            
            # Debug: Print what agents and workload data we're sending to AI
            print(f"DEBUG - Available agents data being sent to AI:")
            for i, agent in enumerate(available_agents):
                print(f"  Agent {i+1}: {agent.get('email')} - Workload: {agent.get('workload', {})}")
            print(f"DEBUG - Formatted agents info for AI:\n{agents_info}")
            
            # Prepare the content for AI analysis
            content = f"""Analyze this ticket and select the best agent:

TICKET INFORMATION:
Title: {ticket_context.get("title", "")}
Description: {ticket_context.get("description", "")}
Content: {ticket_context.get("content_text", "")[:500]}
Category: {ticket_context.get("category", {}).get("name", "Unknown")} (ID: {ticket_context.get("category", {}).get("id", "")})
Subcategory: {ticket_context.get("subcategory", {}).get("name", "Unknown")} (ID: {ticket_context.get("subcategory", {}).get("id", "")})
Priority: {ticket_context.get("priority", "medium")}
Status: {ticket_context.get("status", "new")}

AVAILABLE AGENTS:
{agents_info}

Select the best agent considering skills match primarily, with workload as secondary factor. Respond only with the JSON format specified above."""
            
            messages = [
                {"role": "system", "content": """You are an intelligent ticket assignment system. Your job is to analyze a support ticket and available agents, then select the BEST agent for the task.

Consider these factors when making your decision:
1. **Skills Match**: Does the agent have experience with the ticket's category/subcategory?
2. **Specialization**: Agents with relevant subcategory skills should be preferred over general category matches
3. **Availability**: All agents have normalized workload for consistent assignment

Focus primarily on skills matching for optimal expertise assignment.

You must respond with ONLY a JSON object containing the selected agent's ID, like this:
{"selected_agent_id": "agent_id_here", "reasoning": "brief explanation"}

If no agent is suitable, respond with:
{"selected_agent_id": null, "reasoning": "explanation why no agent was selected"}"""},
                {"role": "user", "content": content}
            ]
            
            # Get AI response
            response = await self.llm.ainvoke(messages)
            response_text = response.content.strip()
            
            # Parse the JSON response (handle markdown code blocks)
            try:
                # Remove markdown code blocks if present
                clean_response = response_text.strip()
                if clean_response.startswith("```json"):
                    clean_response = clean_response[7:]  # Remove ```json
                if clean_response.endswith("```"):
                    clean_response = clean_response[:-3]  # Remove ```
                clean_response = clean_response.strip()
                
                result = json.loads(clean_response)
                selected_agent_id = result.get("selected_agent_id")
                reasoning = result.get("reasoning", "No reasoning provided")
                
                print(f"AI Assignment Decision: {reasoning}")
                
                if selected_agent_id:
                    print(f"AI selected agent: {selected_agent_id}")
                    return selected_agent_id
                else:
                    print("AI decided no agent is suitable")
                    return None
                    
            except json.JSONDecodeError as e:
                print(f"Failed to parse AI response as JSON: {e}")
                print(f"Raw response: {response_text}")
                return None
                
        except Exception as e:
            print(f"Error in AI agent selection: {e}")
            return None
    
    def _format_agents_for_prompt(self, available_agents: List[Dict[str, Any]]) -> str:
        """Format agent information in a readable way for the AI prompt"""
        
        if not available_agents:
            return "No agents available"
        
        formatted_agents = []
        
        for agent in available_agents:
            skills = agent.get("skills", {})
            workload = agent.get("workload", {})
            
            # Format skill information
            category_skill = skills.get("category", {})
            subcategory_skills = skills.get("subcategories", [])
            
            category_info = f"{category_skill.get('name', 'None')}" if category_skill.get('name') else "None"
            subcategory_info = ", ".join([sub.get('name', '') for sub in subcategory_skills]) if subcategory_skills else "None"
            
            # Format workload information for display
            active_tickets = workload.get("active_tickets", 0)
            high_priority_active = workload.get("high_priority_active", 0)
            avg_resolution = workload.get("avg_resolution_hours")
            avg_resolution_str = f"{avg_resolution:.1f}h" if avg_resolution else "N/A"
            
            # Display normalized workload status for consistent assignment
            agent_info = f"""Agent ID: {agent.get('id')}
Name: {agent.get('first_name', '')} {agent.get('last_name', '')}
Email: {agent.get('email', '')}
Category Expertise: {category_info}
Subcategory Skills: {subcategory_info}
Current Workload: Available (normalized for consistent assignment)
Average Resolution Time: {avg_resolution_str}
---"""
            
            formatted_agents.append(agent_info)
        
        return "\n".join(formatted_agents)
    
    async def explain_assignment(self, ticket_context: Dict[str, Any], selected_agent: Dict[str, Any], all_agents: List[Dict[str, Any]]) -> str:
        """
        Generate an explanation for why a particular agent was selected
        
        Args:
            ticket_context: The ticket information
            selected_agent: The agent that was selected
            all_agents: All available agents for comparison
            
        Returns:
            str: Human-readable explanation of the assignment decision
        """
        
        try:
            skills = selected_agent.get("skills", {})
            workload = selected_agent.get("workload", {})
            
            content = f"""Explain why this agent was selected for this ticket:

TICKET: {ticket_context.get("title", "")} (Category: {ticket_context.get("category", {}).get("name", "")}, Priority: {ticket_context.get("priority", "")})

SELECTED AGENT: {selected_agent.get('first_name', '')} {selected_agent.get('last_name', '')}
- Skills: {skills.get("category", {}).get("name", "General")}
- Workload: {workload.get('active_tickets', 0)} active tickets

Provide a brief, professional explanation focusing on the most important factors."""
            
            messages = [
                {"role": "system", "content": "You are explaining why a specific agent was assigned to a support ticket. Be concise and highlight the key factors that made this agent the best choice."},
                {"role": "user", "content": content}
            ]
            
            response = await self.llm.ainvoke(messages)
            return response.content.strip()
            
        except Exception as e:
            print(f"Error generating assignment explanation: {e}")
            return f"Agent {selected_agent.get('email', 'Unknown')} was selected based on skills and workload balance."