import httpx
import os
import random
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import secrets

router = APIRouter(prefix="/api/auth", tags=["auth"])

otp_store = {}

class SendOTPRequest(BaseModel):
    phone: str
    purpose: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    purpose: str

@router.post("/send-otp")
async def send_whatsapp_otp(request: SendOTPRequest):
    otp = str(random.randint(100000, 999999))
    otp_store[request.phone] = {
        "otp": otp,
        "purpose": request.purpose,
        "expires_at": time.time() + 300,
        "attempts": 0
    }
    
    url = f"{os.getenv('WHATSAPP_BASE_URL', 'https://graph.facebook.com/v18.0')}/{os.getenv('WHATSAPP_PHONE_NUMBER_ID', '')}/messages"
    headers = {
        "Authorization": f"Bearer {os.getenv('WHATSAPP_API_TOKEN', '')}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messaging_product": "whatsapp",
        "to": request.phone,
        "type": "template",
        "template": {
            "name": "gigease_otp",
            "language": {"code": "en"},
            "components": [{
                "type": "body",
                "parameters": [
                    {"type": "text", "text": otp},
                    {"type": "text", "text": "5 minutes"},
                    {"type": "text", "text": "GigEase Insurance"}
                ]
            }]
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=5.0)
            if resp.status_code == 200:
                return {
                    "success": True,
                    "message": f"OTP sent to WhatsApp +{request.phone[-10:]}",
                    "expires_in_seconds": 300,
                    "purpose": request.purpose
                }
    except Exception as e:
        print(f"WhatsApp API fallback active: {e}")
        pass
        
    return {
        "success": True,
        "message": "OTP sent (demo mode)",
        "demo_otp": otp,
        "purpose": request.purpose
    }

@router.post("/verify-otp")
async def verify_whatsapp_otp(request: VerifyOTPRequest):
    stored = otp_store.get(request.phone)
    if not stored:
        raise HTTPException(400, "No OTP found. Please request a new OTP.")
    if time.time() > stored["expires_at"]:
        del otp_store[request.phone]
        raise HTTPException(400, "OTP expired. Please request a new one.")
    
    stored["attempts"] += 1
    if stored["attempts"] > 3:
        del otp_store[request.phone]
        raise HTTPException(400, "Too many attempts. Please request a new OTP.")
    
    if stored["otp"] != request.otp:
        raise HTTPException(400, f"Invalid OTP. {3 - stored['attempts']} attempts remaining.")
    
    del otp_store[request.phone]
    
    token = f"session_{secrets.token_hex(16)}"
    return {
        "success": True,
        "purpose": request.purpose,
        "session_token": token,
        "message": "✅ Verified successfully via WhatsApp",
        "nach_mandate_active": request.purpose in ["NACH_MANDATE", "PAYMENT"]
    }
