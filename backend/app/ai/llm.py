import os

from dotenv import load_dotenv
from groq import Groq


load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY is missing from backend/.env")

client = Groq(api_key=GROQ_API_KEY)


def generate_admin_summary(complaint_data: str) -> str:
    prompt = f"""
You are an AI assistant for SmartWaste TN, a municipal waste management platform.

Analyze the complaint information below and create a short admin summary.

Requirements:
- Mention total complaints if available.
- Mention high-priority complaints.
- Mention active or pending complaints.
- Highlight hazardous or urgent waste if present.
- Give 1 or 2 short operational recommendations.
- Keep the response concise and professional.
- Do not invent information that is not provided.

Complaint Data:
{complaint_data}
"""

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",
        messages=[
            {
                "role": "system",
                "content": (
                    "You help municipal administrators understand waste "
                    "complaint data and provide concise operational summaries."
                ),
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
        temperature=0.3,
        max_completion_tokens=500,
    )

    content = response.choices[0].message.content

    if not content:
        return "No AI summary was generated."

    return content.strip()
