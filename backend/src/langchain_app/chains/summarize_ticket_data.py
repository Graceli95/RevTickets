from src.langchain_app.config.model_config import llm

async def summarize_ticket_data(ticket_data: dict) -> str:
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
            {"role": "system", "content": """You are a helpful assistant that summarizes ticket information. 
             Please provide a concise summary of the ticket including the main issue, any relevant details, and current status.
             """},
            {"role": "user", "content": f"Please summarize the following ticket:\n{content}"}
        ]

        response = await llm.ainvoke(messages)
        return response.content.strip()
    except Exception as e:
        print(f"AI summarization failed: {e}")
        # Fallback to simple text-based summary for development
        comment_count = len(ticket_data["comments"])
        tags_text = ", ".join(ticket_data['tags']) if ticket_data['tags'] else "None"
        
        fallback_summary = f"""**Ticket Summary (AI unavailable - using fallback)**

**Issue:** {ticket_data['title']}
**Category:** {ticket_data['category']} → {ticket_data['subcategory']}
**Tags:** {tags_text}
**Description:** {ticket_data['description'][:200]}{'...' if len(ticket_data['description']) > 200 else ''}
**Comments:** {comment_count} comment{'s' if comment_count != 1 else ''}

*Note: This is a basic summary. Full AI summarization requires valid Google API key.*"""
        
        return fallback_summary
