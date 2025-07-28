from src.langchain_app.config.model_config import llm
from langchain_core.output_parsers import JsonOutputParser
from src.schemas.closing_comments import ClosingComments

import json

parser = JsonOutputParser(pydantic_object=ClosingComments)

# ENHANCEMENT L1 AI CLOSING SUGGESTIONS - Generate AI-powered closing comments
async def generate_closing_comments(ticket_data: dict) -> ClosingComments:
    content = (
        f"Ticket Title: {ticket_data['title']}\n"
        f"Description: {ticket_data['description']}\n"
        f"Category: {ticket_data['category']}\n"
        f"Subcategory: {ticket_data['subcategory']}\n"
        f"Tags: {', '.join(ticket_data['tags'])}\n"
        f"Comments:\n" + "\n".join(ticket_data["comments"])
    )

    try:
        messages = [
            {"role": "system", "content": """You are a helpful assistant that generates professional closing comments and reasons for ticket resolution. 
             Analyze the ticket conversation and provide appropriate closing information.
             
             Respond in JSON format:
             {"reason": "Brief reason category (e.g., 'Issue Resolved', 'Configuration Fixed', 'User Assisted')", "comment": "Professional closing comment explaining the resolution"}
             
             Make the closing comment professional, specific to the issue, and helpful to the user.
             """},
            {"role": "user", "content": f"Generate a closing reason and comment for this resolved ticket:\n{content}"}
        ]

        chain = llm | parser
        response = await chain.ainvoke(messages)
        return response
    except Exception as e:
        print(f"AI closing comment generation failed: {e}")
        # Fallback to basic closing comment for development
        comment_count = len(ticket_data["comments"])
        tags_text = ", ".join(ticket_data['tags']) if ticket_data['tags'] else "None"
        
        fallback_comment = f"""Thank you for reporting this issue regarding {ticket_data['title']}. Based on our analysis of the ticket details and the {comment_count} comment{'s' if comment_count != 1 else ''} in this conversation, we believe the issue has been resolved.

If you continue to experience problems or have any additional questions, please don't hesitate to create a new ticket or reopen this one within 10 business days.

*Note: This is a basic closing comment. Full AI-generated suggestions require valid Google API key.*"""
        
        return ClosingComments(
            reason="Issue Resolution",
            comment=fallback_comment
        )