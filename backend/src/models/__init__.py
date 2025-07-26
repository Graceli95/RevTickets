"""
Models package for the ticketing system.

This package contains all database models and related utilities.
"""

from .rich_text import RichTextContent, create_empty_rich_text, create_rich_text_from_html, create_rich_text_from_text
from .user import User
from .category import Category
from .subcategory import SubCategory
from .tag import Tag
from .ticket import Ticket
from .comment import Comment
from .enums import TicketStatus, TicketPriority, TicketSeverity

__all__ = [
    'RichTextContent',
    'create_empty_rich_text', 
    'create_rich_text_from_html',
    'create_rich_text_from_text',
    'User',
    'Category',
    'SubCategory', 
    'Tag',
    'Ticket',
    'Comment',
    'TicketStatus',
    'TicketPriority',
    'TicketSeverity'
]