# backend/app/models.py
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, Float
try:
    from backend.database import Base
except (ImportError, ValueError):
    try:
        from database import Base
    except (ImportError, ValueError):
        from ..database import Base

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(String, unique=True, index=True, nullable=False)  # stable ID from source
    customer = Column(String, nullable=True)
    company = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    owner = Column(String, nullable=True)
    date = Column(DateTime, nullable=True)
    summary = Column(Text, nullable=True)
    outcome = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    follow_up_date = Column(DateTime, nullable=True)
    routing = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    manual_override = Column(Boolean, default=False)
    deal_value = Column(Float, nullable=True, default=0.0)
    stage = Column(String, nullable=True, default="Discovery")
    sentiment = Column(String, nullable=True, default="Neutral")
