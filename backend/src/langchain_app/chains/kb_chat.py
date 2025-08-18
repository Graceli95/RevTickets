# ENHANCEMENT L3: KB CHAT - LangChain chain for knowledge base chat with RAG

from typing import List, Dict, Any, Tuple
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser
from src.langchain_app.config.model_config import chat_model
import logging

logger = logging.getLogger(__name__)


class KBChatChain:
    """LangChain chain for knowledge base chat with RAG capabilities"""
    
    def __init__(self):
        self.chat_model = chat_model
        self._setup_prompt_template()
        self._setup_chain()
    
    def _setup_prompt_template(self):
        """Setup the prompt template for RAG responses"""
        
        self.system_template = """You are a helpful knowledge base assistant for a customer support ticketing system. Your role is to help users find information from the knowledge base articles provided.

Guidelines:
- Use the provided knowledge base articles to answer user questions
- Be concise but comprehensive in your responses
- If the knowledge base doesn't contain relevant information, say so honestly
- Cite which articles you're referencing when applicable
- If the user's question seems to require creating a support ticket, suggest that option
- Maintain a helpful and professional tone
- Consider the conversation history for context

Knowledge Base Articles:
{context}

Conversation History:
{history}"""

        self.human_template = """User Question: {question}

Please provide a helpful response based on the knowledge base articles and conversation context."""

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", self.system_template),
            ("human", self.human_template)
        ])
    
    def _setup_chain(self):
        """Setup the LangChain processing chain"""
        
        self.chain = (
            RunnablePassthrough()
            | self.prompt
            | self.chat_model
            | StrOutputParser()
        )
    
    async def generate_response(self, question: str, contexts: List[Dict[str, Any]], 
                              history: List[Dict[str, str]]) -> Tuple[str, List[Dict[str, Any]]]:
        """Generate AI response using RAG with provided contexts"""
        
        try:
            # Format contexts for the prompt
            context_text = self._format_contexts(contexts)
            
            # Format conversation history
            history_text = self._format_history(history)
            
            # Generate response
            response = await self.chain.ainvoke({
                "context": context_text,
                "history": history_text,
                "question": question
            })
            
            # Determine which sources were likely used
            used_sources = self._determine_used_sources(response, contexts)
            
            logger.info(f"Generated KB chat response with {len(used_sources)} sources")
            return response, used_sources
            
        except Exception as e:
            logger.error(f"Failed to generate KB chat response: {e}")
            raise
    
    def _format_contexts(self, contexts: List[Dict[str, Any]]) -> str:
        """Format knowledge base contexts for the prompt"""
        
        if not contexts:
            return "No relevant knowledge base articles found."
        
        formatted = []
        for i, context in enumerate(contexts, 1):
            formatted.append(f"""
Article {i}: {context['title']}
Content: {context['content'][:1000]}{"..." if len(context['content']) > 1000 else ""}
Relevance Score: {context['similarity']:.2f}
""")
        
        return "\n".join(formatted)
    
    def _format_history(self, history: List[Dict[str, str]]) -> str:
        """Format conversation history for context"""
        
        if not history:
            return "No previous conversation."
        
        formatted = []
        for msg in history[-6:]:  # Last 6 messages for context
            role = "User" if msg['role'] == 'user' else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        
        return "\n".join(formatted)
    
    def _determine_used_sources(self, response: str, contexts: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Determine which knowledge base articles were likely referenced in the response"""
        
        used_sources = []
        response_lower = response.lower()
        
        for context in contexts:
            # Check if article title or key terms appear in response
            title_words = context['title'].lower().split()
            content_words = context['content'].lower().split()[:50]  # First 50 words
            
            # Calculate relevance based on word overlap
            title_matches = sum(1 for word in title_words if len(word) > 3 and word in response_lower)
            content_matches = sum(1 for word in content_words if len(word) > 4 and word in response_lower)
            
            relevance_score = (title_matches * 2 + content_matches) / max(len(title_words) + len(content_words[:10]), 1)
            
            if relevance_score > 0.1 or context['similarity'] > 0.8:  # High similarity articles are likely used
                used_sources.append({
                    "id": context["id"],
                    "title": context["title"],
                    "excerpt": self._extract_relevant_excerpt(context['content'], response),
                    "relevance": min(relevance_score, 1.0)
                })
        
        # Sort by relevance and return top sources
        used_sources.sort(key=lambda x: x['relevance'], reverse=True)
        return used_sources[:3]  # Return top 3 most relevant sources
    
    def _extract_relevant_excerpt(self, content: str, response: str) -> str:
        """Extract the most relevant excerpt from the article content"""
        
        # Simple approach: find sentences that share words with the response
        sentences = content.split('. ')
        response_words = set(response.lower().split())
        
        best_sentence = ""
        max_overlap = 0
        
        for sentence in sentences[:10]:  # Check first 10 sentences
            sentence_words = set(sentence.lower().split())
            overlap = len(response_words.intersection(sentence_words))
            
            if overlap > max_overlap and len(sentence) > 20:
                max_overlap = overlap
                best_sentence = sentence
        
        if best_sentence:
            return best_sentence[:200] + "..." if len(best_sentence) > 200 else best_sentence
        
        # Fallback to first part of content
        return content[:200] + "..." if len(content) > 200 else content


class KBChatAnalytics:
    """Analytics helper for KB chat interactions"""
    
    @staticmethod
    def extract_intent(message: str) -> str:
        """Extract user intent from message"""
        
        message_lower = message.lower()
        
        # Simple intent classification
        if any(word in message_lower for word in ['how', 'what', 'when', 'where', 'why']):
            return "question"
        elif any(word in message_lower for word in ['help', 'assist', 'support']):
            return "help_request"
        elif any(word in message_lower for word in ['problem', 'issue', 'error', 'bug']):
            return "problem_report"
        elif any(word in message_lower for word in ['thanks', 'thank', 'appreciate']):
            return "acknowledgment"
        else:
            return "general"
    
    @staticmethod
    def extract_topics(message: str) -> List[str]:
        """Extract key topics/keywords from message"""
        
        # Simple keyword extraction
        import re
        words = re.findall(r'\b\w{4,}\b', message.lower())  # Words with 4+ characters
        
        # Filter common words
        stop_words = {'this', 'that', 'with', 'have', 'will', 'from', 'they', 'know', 
                     'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 
                     'come', 'here', 'just', 'like', 'long', 'make', 'many', 'over', 
                     'such', 'take', 'than', 'them', 'well', 'were'}
        
        topics = [word for word in set(words) if word not in stop_words]
        return topics[:5]  # Return top 5 topics
    
    @staticmethod
    def should_suggest_ticket_creation(message: str, response: str) -> bool:
        """Determine if ticket creation should be suggested"""
        
        message_lower = message.lower()
        response_lower = response.lower()
        
        # Suggest ticket if:
        # 1. User describes a problem and KB couldn't help much
        # 2. User asks for account-specific help
        # 3. Response indicates limited KB information
        
        problem_indicators = ['problem', 'issue', 'error', 'bug', 'broken', 'not working']
        account_indicators = ['my account', 'my order', 'my ticket', 'my subscription']
        limited_help_indicators = ['contact support', 'create a ticket', 'further assistance']
        
        has_problem = any(indicator in message_lower for indicator in problem_indicators)
        needs_account_help = any(indicator in message_lower for indicator in account_indicators)
        limited_kb_help = any(indicator in response_lower for indicator in limited_help_indicators)
        
        return has_problem or needs_account_help or limited_kb_help