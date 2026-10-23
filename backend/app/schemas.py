# backend/app/schemas.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class ConversationBase(BaseModel):
    source_id: str = Field(..., description="Stable identifier from source data")
    customer: Optional[str] = None
    company: Optional[str] = None
    contact: Optional[str] = None
    owner: Optional[str] = None
    date: Optional[datetime] = None
    summary: Optional[str] = None
    outcome: Optional[str] = None
    priority: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    routing: Optional[str] = None
    notes: Optional[str] = None
    manual_override: Optional[bool] = False
    deal_value: Optional[float] = 0.0
    stage: Optional[str] = "Discovery"
    sentiment: Optional[str] = "Neutral"

    @classmethod
    def from_dict(cls, data: dict):
        """Create a ConversationBase (or subclass) from a raw dict.
        Handles conversion of date strings to datetime and numbers where possible.
        """
        data = dict(data)  # shallow copy
        for field in ["date", "follow_up_date"]:
            if field in data and isinstance(data[field], str) and data[field].strip():
                try:
                    data[field] = datetime.fromisoformat(data[field].replace("Z", "+00:00"))
                except Exception:
                    try:
                        # Try common date formats
                        from datetime import date
                        data[field] = datetime.strptime(data[field].strip(), "%Y-%m-%d")
                    except Exception:
                        data[field] = None
            elif field in data and not data[field]:
                data[field] = None

        if "deal_value" in data and data["deal_value"] is not None:
            try:
                data["deal_value"] = float(str(data["deal_value"]).replace("$", "").replace(",", "").strip())
            except Exception:
                data["deal_value"] = 0.0

        if "manual_override" in data and isinstance(data["manual_override"], str):
            data["manual_override"] = data["manual_override"].lower() in {"true", "1", "yes"}

        return cls(**data)

class ConversationCreate(ConversationBase):
    pass

class ConversationUpdate(BaseModel):
    customer: Optional[str] = None
    company: Optional[str] = None
    contact: Optional[str] = None
    owner: Optional[str] = None
    date: Optional[datetime] = None
    summary: Optional[str] = None
    outcome: Optional[str] = None
    priority: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    routing: Optional[str] = None
    notes: Optional[str] = None
    manual_override: Optional[bool] = None
    deal_value: Optional[float] = None
    stage: Optional[str] = None
    sentiment: Optional[str] = None

class Conversation(ConversationBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
