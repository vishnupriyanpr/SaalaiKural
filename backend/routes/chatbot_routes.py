from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import json

router = APIRouter(prefix="/chatbot", tags=["chatbot"])

class ChatMessage(BaseModel):
    message: str

WEBHOOK_URL = "https://vishnun8nnnn.app.n8n.cloud/webhook-test/roadwatch-chat"

@router.post("/")
async def chat_with_bot(request: ChatMessage):
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # The original frontend sent JSON stringified payload inside a text/plain request
            payload = json.dumps({"message": request.message})
            response = await client.post(
                WEBHOOK_URL,
                content=payload,
                headers={"Content-Type": "text/plain"}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"Webhook HTTP error: {e.response.text}")
        except httpx.RequestError as e:
            raise HTTPException(status_code=500, detail=f"Webhook request error: {str(e)}")
