# ENHANCEMENT L3: KB CHAT - LangChain chain for knowledge base chat with RAG

from typing import List, Dict, Any
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from src.langchain_app.config.model_config import chat_model
import logging
from src.langchain_app.config.chroma_config import get_chroma_client
from src.langchain_app.config.model_config import embedding_model



logger = logging.getLogger(__name__)

COLLECTION_NAME = "articles_collection"


class KBChatChain:
    """LangChain chain for knowledge base chat with RAG capabilities"""

    def __init__(self):
        self.chat_model = chat_model
        self._setup_prompt_template()
        client = get_chroma_client()
        self.collection = client.get_or_create_collection(
            name=COLLECTION_NAME
        )
        self.embeddings = embedding_model


    def _setup_prompt_template(self):
        """Setup the prompt template for RAG responses"""

        self.prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful knowledge base assistant for a customer support system.

Use the provided knowledge base articles to answer user questions.
- Be concise but clear
- If the KB does not contain relevant info, say so honestly
- Suggest creating a support ticket if needed
- Maintain a professional tone
- Consider conversation history

Knowledge Base Articles:
{context}

Conversation History:
{history}
"""),
            ("human", "User Question: {question}")
        ])

        # Attach parser directly
        self.chain = self.prompt | self.chat_model | StrOutputParser()

    async def generate_response(
        self,
        question: str,
        history: List[Dict[str, str]]
    ) -> str:
        """Generate AI response using RAG with provided contexts"""
        try:
            context_text, sources = self._format_contexts(question)
            history_text = self._format_history(history)

            response = await self.chain.ainvoke({
                "context": context_text,
                "history": history_text,
                "question": question
            })

            return response, sources
        except Exception as e:
            logger.error(f"Failed to generate KB chat response: {e}")
            raise

    def _format_contexts(self, question: str, top_k: int = 5) -> (str, List[Dict[str, str]]):
        """Retrieve top-k relevant articles and return both text and structured sources."""
        try:
            query_embedding = self.embeddings.embed_query(question)
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )

            contexts = []
            sources = []
            for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
                title = meta.get("title", "Untitled")
                article_id = meta.get("article_id", "")
                contexts.append(f"{title}: {doc}")
                sources.append({
                    "title": title,
                    "article_id": article_id
                })

            return "\n\n".join(contexts), sources
        except Exception as e:
            logger.error(f"Failed to retrieve contexts from Chroma: {e}")
            raise

            
    def _format_history(self, history: List[Dict[str, str]]) -> str:
        """Format conversation history for context"""
        if not history:
            return "No previous conversation."

        formatted = []
        for msg in history[-6:]:  # keep last 6 turns
            role = "User" if msg['role'] == 'user' else "Assistant"
            formatted.append(f"{role}: {msg['content']}")
        return "\n".join(formatted)

    @staticmethod
    async def process_message(session_id: str, user_message: str) -> Dict[str, Any]:
        session = await KBChatService.get_session(session_id)
        if not session:
            raise ValueError("Chat session not found")

        await session.add_message(user_message, "user")

        try:
            chat_history = await KBChatService._get_chat_history(session)

            chain = KBChatChain()
            ai_response, sources = await chain.generate_response(user_message, chat_history)

            await session.add_message(message=ai_response, message_type="assistant")

            return {
                "response": ai_response,
                "sources": sources,
                "session_id": str(session.id),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to process message in session {session_id}: {e}")
            fallback = "I’m having trouble processing your request right now."
            await session.add_message(fallback, "assistant")
            return {
                "response": fallback,
                "sources": [],
                "session_id": str(session.id),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }