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

    messages = [
        {"role": "system", "content": """You are a helpful assistant that summarizes ticket information. 
         output:
         """},
        {"role": "user", "content": f"Please summarize the following ticket:\n{content}"}
    ]

    response = await llm.ainvoke(messages)
    return response.content.strip()
