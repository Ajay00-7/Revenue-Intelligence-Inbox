# backend/app/crud.py
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from . import models, schemas
from typing import List, Dict, Optional
from datetime import datetime

def get_conversation(db: Session, conv_id: int):
    return db.query(models.Conversation).filter(models.Conversation.id == conv_id).first()

def get_conversation_by_source_id(db: Session, source_id: str):
    return db.query(models.Conversation).filter(models.Conversation.source_id == source_id).first()

def get_conversations(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = None,
    priority: Optional[str] = None,
    routing: Optional[str] = None,
    stage: Optional[str] = None
) -> List[models.Conversation]:
    query = db.query(models.Conversation)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.Conversation.company.ilike(search_term),
                models.Conversation.customer.ilike(search_term),
                models.Conversation.contact.ilike(search_term),
                models.Conversation.summary.ilike(search_term),
                models.Conversation.notes.ilike(search_term),
                models.Conversation.owner.ilike(search_term)
            )
        )
    
    if priority and priority != "all":
        query = query.filter(models.Conversation.priority.ilike(priority))
        
    if routing and routing != "all":
        query = query.filter(models.Conversation.routing.ilike(routing))

    if stage and stage != "all":
        query = query.filter(models.Conversation.stage.ilike(stage))
        
    return query.order_by(desc(models.Conversation.date)).offset(skip).limit(limit).all()

def create_conversation(db: Session, conv: schemas.ConversationCreate):
    conv_dict = conv.model_dump() if hasattr(conv, "model_dump") else conv.dict()
    db_conv = models.Conversation(**conv_dict)
    db.add(db_conv)
    db.commit()
    db.refresh(db_conv)
    return db_conv

def update_conversation(db: Session, conv_id: int, conv: schemas.ConversationCreate):
    db_conv = get_conversation(db, conv_id)
    if not db_conv:
        return None
    conv_dict = conv.model_dump() if hasattr(conv, "model_dump") else conv.dict()
    for field, value in conv_dict.items():
        if hasattr(db_conv, field):
            setattr(db_conv, field, value)
    db.commit()
    db.refresh(db_conv)
    return db_conv

def update_conversation_partial(db: Session, conv_id: int, payload: schemas.ConversationUpdate):
    db_conv = get_conversation(db, conv_id)
    if not db_conv:
        return None
    update_data = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    for field, value in update_data.items():
        if hasattr(db_conv, field):
            setattr(db_conv, field, value)
    
    # Mark as manual override if not explicitly specified as False
    if "manual_override" not in update_data:
        db_conv.manual_override = True
        
    db.commit()
    db.refresh(db_conv)
    return db_conv

def delete_conversation(db: Session, conv_id: int):
    db_conv = get_conversation(db, conv_id)
    if not db_conv:
        return False
    db.delete(db_conv)
    db.commit()
    return True

def is_same(db_conv: models.Conversation, conv: schemas.ConversationCreate) -> bool:
    """Return True if all fields except manual_override and id are equal"""
    fields = getattr(conv, "model_fields", None) or getattr(conv, "__fields__", {})
    for field in fields:
        if field == "manual_override":
            continue
        if getattr(db_conv, field, None) != getattr(conv, field, None):
            return False
    return True

def get_all_as_dicts(db: Session) -> List[Dict]:
    rows = db.query(models.Conversation).all()
    result = []
    for r in rows:
        result.append({
            "id": r.id,
            "source_id": r.source_id,
            "customer": r.customer,
            "company": r.company,
            "contact": r.contact,
            "owner": r.owner,
            "date": r.date.isoformat() if r.date else None,
            "summary": r.summary,
            "outcome": r.outcome,
            "priority": r.priority,
            "follow_up_date": r.follow_up_date.isoformat() if r.follow_up_date else None,
            "routing": r.routing,
            "notes": r.notes,
            "manual_override": r.manual_override,
            "deal_value": getattr(r, "deal_value", 0.0) or 0.0,
            "stage": getattr(r, "stage", "Discovery") or "Discovery",
            "sentiment": getattr(r, "sentiment", "Neutral") or "Neutral"
        })
    return result

def get_revenue_metrics(db: Session) -> Dict:
    rows = db.query(models.Conversation).all()
    now = datetime.now()
    
    total = len(rows)
    pending_follow_ups = 0
    high_priority = 0
    total_pipeline_value = 0.0
    closed_won_value = 0.0
    priority_breakdown = {"High": 0, "Medium": 0, "Low": 0, "Urgent": 0}
    stage_breakdown = {}
    routing_breakdown = {}
    
    for r in rows:
        val = getattr(r, "deal_value", 0.0) or 0.0
        total_pipeline_value += val
        
        p = (r.priority or "Medium").capitalize()
        priority_breakdown[p] = priority_breakdown.get(p, 0) + 1
        if p in ["High", "Urgent"]:
            high_priority += 1
            
        stage = getattr(r, "stage", None) or "Discovery"
        stage_breakdown[stage] = stage_breakdown.get(stage, 0) + 1
        
        routing = r.routing or "Unassigned"
        routing_breakdown[routing] = routing_breakdown.get(routing, 0) + 1
        
        if (r.outcome or "").lower() == "closed won" or stage.lower() == "closed won":
            closed_won_value += val
            
        if r.follow_up_date:
            try:
                # Compare without timezone if naive
                fdate = r.follow_up_date
                if fdate.tzinfo:
                    fdate = fdate.replace(tzinfo=None)
                if fdate <= now:
                    pending_follow_ups += 1
            except Exception:
                pass
        else:
            pending_follow_ups += 1

    return {
        "total": total,
        "pending": pending_follow_ups,
        "highPriority": high_priority,
        "totalPipelineValue": total_pipeline_value,
        "closedWonValue": closed_won_value,
        "avgDealSize": (total_pipeline_value / total) if total > 0 else 0.0,
        "priorityBreakdown": priority_breakdown,
        "stageBreakdown": stage_breakdown,
        "routingBreakdown": routing_breakdown
    }
