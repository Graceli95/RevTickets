from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from src.core.config import settings

# Chat model for general LLM operations
llm = ChatGoogleGenerativeAI(
    google_api_key = settings.google_api_key,
    model="gemini-2.0-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# Chat model for KB chat operations
chat_model = ChatGoogleGenerativeAI(
    google_api_key = settings.google_api_key,
    model="gemini-2.0-flash",
    temperature=0.3,  # Slightly higher temperature for more natural responses
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# Embedding model for vector operations
embedding_model = GoogleGenerativeAIEmbeddings(
    google_api_key = settings.google_api_key,
    model="models/embedding-001"
)