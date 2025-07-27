from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class RichTextContent(BaseModel):
    """Rich text content with multiple formats for flexibility and compatibility"""
    
    html: str = Field(..., description="HTML representation of the content for display")
    json_content: Dict[str, Any] = Field(..., alias="json", description="TipTap JSON representation for editor compatibility")
    text: str = Field(..., description="Plain text representation for search and indexing")
    
    class Config:
        # Allow the model to be used in MongoDB documents
        arbitrary_types_allowed = True
        # JSON schema extra info - using v2 naming
        json_schema_extra = {
            "example": {
                "html": "<p>This is <strong>bold</strong> text with a <a href='https://example.com'>link</a>.</p>",
                "json": {
                    "type": "doc",
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {"type": "text", "text": "This is "},
                                {"type": "text", "text": "bold", "marks": [{"type": "bold"}]},
                                {"type": "text", "text": " text with a "},
                                {"type": "text", "text": "link", "marks": [{"type": "link", "attrs": {"href": "https://example.com"}}]},
                                {"type": "text", "text": "."}
                            ]
                        }
                    ]
                },
                "text": "This is bold text with a link."
            }
        }

def create_empty_rich_text() -> RichTextContent:
    """Create an empty RichTextContent object"""
    return RichTextContent(
        html="",
        json={"type": "doc", "content": []},
        text=""
    )

def create_rich_text_from_html(html: str) -> RichTextContent:
    """Create RichTextContent from HTML string (for migration purposes)"""
    import re
    # Simple HTML to text conversion for migration
    text = re.sub(r'<[^>]+>', '', html).strip()
    
    return RichTextContent(
        html=html,
        json={"type": "doc", "content": []},  # Will be populated by frontend editor
        text=text
    )

def create_rich_text_from_text(text: str) -> RichTextContent:
    """Create RichTextContent from plain text"""
    html = text.replace('\n', '<br>')
    
    json_content = {
        "type": "doc",
        "content": [
            {
                "type": "paragraph",
                "content": [
                    {
                        "type": "text",
                        "text": text
                    }
                ]
            }
        ] if text.strip() else []
    }
    
    return RichTextContent(
        html=html,
        json=json_content,
        text=text
    )