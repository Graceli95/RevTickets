from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from src.core.config import settings

# Chat model for general LLM operations
llm = ChatOpenAI(
    openai_api_key=settings.openai_api_key,
    model="gpt-4o",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# Chat model for KB chat operations
chat_model = ChatOpenAI(
    openai_api_key=settings.openai_api_key,
    model="gpt-4o",   # you can pick "gpt-4o" for higher quality
    temperature=0.3,       # slightly higher temp for more natural responses
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# Embedding model for vector operations
embedding_model = OpenAIEmbeddings(
    openai_api_key=settings.openai_api_key,
    model="text-embedding-3-small"   # or "text-embedding-3-large"
)
