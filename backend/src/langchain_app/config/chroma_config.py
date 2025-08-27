from chromadb import HttpClient
from urllib.parse import urlparse
from src.core.config import settings


parsed = urlparse(settings.chroma_url)
host = parsed.hostname  # extracts host correctly
port = parsed.port      # extracts port correctly


# Init Chroma + OpenAI embeddings
def get_chroma_client():
    """Return a Chroma client WITHOUT validating tenant immediately"""
    client = HttpClient(host=host, port=port)  # no validation yet

    return client