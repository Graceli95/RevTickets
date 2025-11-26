from langchain_google_genai import ChatGoogleGenerativeAI
from src.core.config import settings



llm = ChatGoogleGenerativeAI(
    google_api_key = settings.google_api_key,
    model="gemini-2.0-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)