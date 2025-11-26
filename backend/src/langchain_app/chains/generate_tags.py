from src.langchain_app.config.model_config import llm
from typing import List
import json
import logging

logger = logging.getLogger(__name__)

def parse_tags_from_response(response_text: str) -> List[str]:
    """Parse tags from LLM response."""
    try:
        # Try to parse as JSON first
        if response_text.strip().startswith('['):
            parsed = json.loads(response_text.strip())
            if isinstance(parsed, list):
                return [str(tag).strip() for tag in parsed if tag.strip()]
        
        # Fallback: parse as comma-separated values or line-separated
        lines = response_text.strip().split('\n')
        tags = []
        for line in lines:
            # Remove common prefixes
            clean_line = line.strip()
            for prefix in ["Tags:", "tags:", "- ", "* ", "• ", "1.", "2.", "3.", "4.", "5.", "6.", "7.", "8."]:
                if clean_line.startswith(prefix):
                    clean_line = clean_line[len(prefix):].strip()
            
            # Split by commas and clean up
            if clean_line and not clean_line.startswith('[') and not clean_line.startswith(']'):
                line_tags = [tag.strip(' "\'') for tag in clean_line.split(',') if tag.strip()]
                tags.extend(line_tags)
        
        # Remove duplicates and filter
        seen = set()
        unique_tags = []
        for tag in tags:
            if tag.lower() not in seen and len(tag) > 1 and len(tag) < 50:
                seen.add(tag.lower())
                unique_tags.append(tag)
        
        return unique_tags[:8]  # Limit to 8 tags
        
    except Exception as e:
        logger.error(f"Error parsing tags from LLM response: {e}")
        return []

async def generate_tags_for_article(title: str, content: str) -> List[str]:
    """
    Generate tags for an article using AI.
    
    Args:
        title: Article title
        content: Article content (can be plain text or HTML)
    
    Returns:
        List of generated tags
    """
    try:
        # Clean up content - truncate if too long
        clean_content = content
        if len(clean_content) > 2000:  # Truncate very long content
            clean_content = clean_content[:2000] + "..."
        
        # Create the prompt
        prompt = f"""You are an expert at analyzing technical documentation and generating relevant tags for knowledge base articles.

Article Title: {title}

Article Content: {clean_content}

IMPORTANT: Focus only on the actual content meaning and topics discussed in the article. Ignore any JSON structure, HTML formatting, or technical formatting you see. Do not create tags for:
- Data formats (like "json", "html", "xml")
- Technical formatting elements
- Structural elements

Based on the ACTUAL TOPICS and MEANING in the title and content above, generate 5-8 relevant tags that would help users find this article when searching. The tags should be:
- Specific and descriptive of the actual subject matter
- Relevant to the main topics and concepts covered
- Useful for categorization and search
- Technology or domain-specific when appropriate (but not format-specific)
- Concise (1-3 words each)

Return only a JSON array of tags, nothing else. Example format:
["networking", "troubleshooting", "vpn", "windows", "configuration"]"""

        # Generate response using the configured LLM
        messages = [
            {"role": "system", "content": "You are a helpful assistant that generates relevant tags for knowledge base articles based on content meaning, not formatting. Focus on topics, concepts, and subject matter. Ignore any JSON, HTML, or other technical formatting. Always return a JSON array of strings."},
            {"role": "user", "content": prompt}
        ]
        
        response = await llm.ainvoke(messages)
        
        # Extract content from response
        response_text = response.content if hasattr(response, 'content') else str(response)
        
        # Parse tags from the response
        tags = parse_tags_from_response(response_text)
        
        return tags
        
    except Exception as e:
        logger.error(f"Error generating tags for article '{title}': {e}")
        return []