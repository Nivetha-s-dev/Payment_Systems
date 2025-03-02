from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime, date
from enum import Enum

class PaymentStatus(str, Enum):
    COMPLETED = "completed"
    DUE_NOW = "due_now"
    OVERDUE = "overdue"
    PENDING = "pending"

class Payment(BaseModel):
    payee_first_name: str
    payee_last_name: str
    payee_payment_status: PaymentStatus
    payee_added_date_utc: datetime
    payee_due_date: date
    payee_address_line_1: str
    payee_address_line_2: Optional[str] = None
    payee_city: str
    payee_country: str
    payee_province_or_state: Optional[str] = None
    payee_postal_code: str
    payee_phone_number: str
    payee_email: EmailStr
    currency: str
    discount_percent: Optional[float] = None
    tax_percent: Optional[float] = None
    due_amount: float = Field(..., ge=0)
    total_due: Optional[float] = None
