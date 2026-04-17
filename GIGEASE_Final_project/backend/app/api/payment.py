"""
Mock Razorpay Payment & Settings API — standalone (no ORM).
"""
from fastapi import APIRouter
import uuid
import time

router = APIRouter(prefix="/api/payment", tags=["payment"])

# In-memory demo settings store
_settings_store: dict = {}


@router.post("/initiate-mock-razorpay")
async def initiate_mock_razorpay(
    worker_id: str = "W001",
    amount_paise: int = 15000,
    purpose: str = "PREMIUM_DEBIT",
):
    mock_order_id = f"order_mock_{uuid.uuid4().hex[:14]}"
    return {
        "order_id": mock_order_id,
        "amount_paise": amount_paise,
        "amount_inr": amount_paise / 100,
        "currency": "INR",
        "purpose": purpose,
        "worker_id": worker_id,
        "business_name": "GigEase Insurance",
        "is_trusted": True,
        "payment_methods": [
            {"id": "upi",        "label": "UPI / QR",    "desc": "PhonePe, GPay, BHIM & More", "icon": "upi"},
            {"id": "card",       "label": "Card",        "desc": "Visa, MasterCard, RuPay & More", "icon": "card"},
            {"id": "netbanking", "label": "Netbanking",  "desc": "All Indian banks", "icon": "bank"},
            {"id": "wallet",     "label": "Wallet",      "desc": "PhonePe & More", "icon": "wallet"},
        ],
        "prefill": {"phone": "9999999999"},
        "expires_at": int(time.time()) + 900,
    }


@router.post("/mock-razorpay-success")
async def mock_razorpay_success(
    order_id: str = "order_mock_demo",
    payment_method: str = "upi",
    upi_id: str = None,
):
    payment_id = f"pay_mock_{uuid.uuid4().hex[:14]}"
    return {
        "success": True,
        "payment_id": payment_id,
        "order_id": order_id,
        "method": payment_method,
        "message": "Payment successful (Demo Mode)",
        "nach_mandate_active": True,
        "upi_linked": upi_id is not None,
    }


@router.get("/settings/{worker_id}")
async def get_payment_settings(worker_id: str):
    s = _settings_store.get(worker_id, {})
    return {
        "worker_id": worker_id,
        "autopay_enabled": s.get("autopay_enabled", False),
        "claiming_mode": s.get("claiming_mode", "MANUAL"),
        "upi_linked": True,
        "nach_mandate_active": s.get("autopay_enabled", False),
        "phone_verified_whatsapp": True,
    }


@router.post("/settings/{worker_id}")
async def update_payment_settings(
    worker_id: str,
    autopay_enabled: bool = False,
    claiming_mode: str = "MANUAL",
):
    _settings_store[worker_id] = {
        "autopay_enabled": autopay_enabled,
        "claiming_mode": claiming_mode,
    }
    return {
        "success": True,
        "claiming_mode": claiming_mode,
        "message": (
            "AutoPay enabled - claims credited automatically"
            if claiming_mode == "AUTOPAY"
            else "Manual mode - you approve each claim before payout"
        ),
    }
