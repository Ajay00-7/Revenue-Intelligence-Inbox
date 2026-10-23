# backend/app/main.py
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from pathlib import Path
from typing import Optional, List
from datetime import datetime, timedelta
import csv
import json
import io
import uuid

from . import models, schemas, crud

try:
    from backend.database import engine, get_db
except (ImportError, ValueError):
    try:
        from database import engine, get_db
    except (ImportError, ValueError):
        from ..database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

# Auto-migrate any missing columns for SQLite
try:
    with engine.connect() as conn:
        for col_name, col_type in [
            ("deal_value", "REAL DEFAULT 0.0"), 
            ("stage", "VARCHAR DEFAULT 'Discovery'"), 
            ("sentiment", "VARCHAR DEFAULT 'Neutral'")
        ]:
            try:
                conn.execute(text(f"ALTER TABLE conversations ADD COLUMN {col_name} {col_type}"))
                conn.commit()
            except Exception:
                pass
except Exception as e:
    print(f"Migration note: {e}")

app = FastAPI(title="Revenue Intelligence Inbox API", version="1.0.0")

# Allow frontend to access API
import os
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed realistic revenue intelligence conversations if database is empty
def seed_sample_data(db: Session):
    existing_count = db.query(models.Conversation).count()
    if existing_count > 0:
        return

    now = datetime.now()
    sample_items = [
        {
            "source_id": "REV-1001",
            "customer": "Sarah Jenkins",
            "company": "Acme Cloud Infrastructure",
            "contact": "sarah.j@acmecloud.io",
            "owner": "Marcus Vance",
            "date": now - timedelta(hours=3),
            "summary": "Urgent request to expand contract for 1,500 developer seats before Q4 budget closes. Discussed custom SLA and dedicated VPC deployment.",
            "outcome": "Proposal Sent",
            "priority": "High",
            "follow_up_date": now + timedelta(hours=4),
            "routing": "Enterprise Sales",
            "notes": "Decision maker: CTO approved. Needs final security questionnaire signed off.",
            "manual_override": False,
            "deal_value": 85000.0,
            "stage": "Proposal",
            "sentiment": "Positive"
        },
        {
            "source_id": "REV-1002",
            "customer": "David Zhao",
            "company": "TechCorp Global",
            "contact": "dzhao@techcorpglobal.com",
            "owner": "Elena Rostova",
            "date": now - timedelta(hours=8),
            "summary": "Enterprise SSO & Okta integration discussion. Security team requested SOC2 Type II report and audit log retention guarantees.",
            "outcome": "Meeting Scheduled",
            "priority": "High",
            "follow_up_date": now - timedelta(hours=1), # overdue follow-up
            "routing": "Enterprise Sales",
            "notes": "Follow up with VP of Information Security regarding penetration test findings.",
            "manual_override": False,
            "deal_value": 120000.0,
            "stage": "Security Review",
            "sentiment": "Neutral"
        },
        {
            "source_id": "REV-1003",
            "customer": "Rachel Green",
            "company": "DataSphere Analytics",
            "contact": "rachel@datasphere.ai",
            "owner": "Alex Rivera",
            "date": now - timedelta(days=1, hours=2),
            "summary": "Customer flagged telemetry volume exceeding tiered tier. Potential churn risk if overage fees are not bundled into annual enterprise commitment.",
            "outcome": "Action Required",
            "priority": "High",
            "follow_up_date": now - timedelta(hours=5), # overdue
            "routing": "Customer Success",
            "notes": "Offered 20% discount on volume tiered upgrade to prevent contract cancellation.",
            "manual_override": True,
            "deal_value": 45000.0,
            "stage": "Negotiation",
            "sentiment": "Negative"
        },
        {
            "source_id": "REV-1004",
            "customer": "Michael Chang",
            "company": "Horizon Autonomous Logistics",
            "contact": "mchang@horizonlogistics.com",
            "owner": "Marcus Vance",
            "date": now - timedelta(days=1, hours=7),
            "summary": "Product trial completed successfully with 99.98% pipeline ingestion rate. Scheduled executive alignment call with Head of Engineering.",
            "outcome": "Demo Completed",
            "priority": "Medium",
            "follow_up_date": now + timedelta(days=2),
            "routing": "Mid-Market",
            "notes": "Ready for formal pricing tier review. High expansion potential.",
            "manual_override": False,
            "deal_value": 65000.0,
            "stage": "Evaluation",
            "sentiment": "Positive"
        },
        {
            "source_id": "REV-1005",
            "customer": "Liam O'Connor",
            "company": "FinLeap Technologies",
            "contact": "liam@finleap.co",
            "owner": "Elena Rostova",
            "date": now - timedelta(days=2),
            "summary": "Inbound inquiry regarding real-time fraud alert webhooks and webhook latency benchmarks under high burst traffic.",
            "outcome": "Discovery Call",
            "priority": "Medium",
            "follow_up_date": now + timedelta(days=1),
            "routing": "Inbound Sales",
            "notes": "Sent developer documentation and Postman collections.",
            "manual_override": False,
            "deal_value": 32000.0,
            "stage": "Discovery",
            "sentiment": "Positive"
        },
        {
            "source_id": "REV-1006",
            "customer": "Victoria Sterling",
            "company": "Global Retail Partners",
            "contact": "vsterling@globalretail.org",
            "owner": "Marcus Vance",
            "date": now - timedelta(days=2, hours=10),
            "summary": "Global multi-region data sovereignty review for EU GDPR and APAC compliance. Multi-year platform standardization.",
            "outcome": "Contract Sent",
            "priority": "High",
            "follow_up_date": now + timedelta(days=3),
            "routing": "Enterprise Sales",
            "notes": "Legal department reviewed terms; waiting on final signature from CFO.",
            "manual_override": False,
            "deal_value": 150000.0,
            "stage": "Closing",
            "sentiment": "Positive"
        },
        {
            "source_id": "REV-1007",
            "customer": "Carlos Mendez",
            "company": "Pulse Health Systems",
            "contact": "carlos.m@pulsehealth.com",
            "owner": "Alex Rivera",
            "date": now - timedelta(days=3),
            "summary": "Self-serve team inquiry about automated HIPAA compliance safeguards and Business Associate Agreement (BAA) signing.",
            "outcome": "Follow-up Sent",
            "priority": "Low",
            "follow_up_date": now + timedelta(days=4),
            "routing": "Inbound Sales",
            "notes": "Requires BAA template upload before upgrade.",
            "manual_override": False,
            "deal_value": 24000.0,
            "stage": "Discovery",
            "sentiment": "Neutral"
        },
        {
            "source_id": "REV-1008",
            "customer": "Priya Sharma",
            "company": "AlphaCore Dynamics",
            "contact": "priya.s@alphacore.io",
            "owner": "Marcus Vance",
            "date": now - timedelta(days=4),
            "summary": "Annual enterprise contract finalized and signed. Full platform rollout scheduled across 4 global subsidiaries.",
            "outcome": "Closed Won",
            "priority": "High",
            "follow_up_date": None,
            "routing": "Enterprise Sales",
            "notes": "Onboarding kickoff meeting scheduled for next Monday with Customer Success.",
            "manual_override": False,
            "deal_value": 98000.0,
            "stage": "Closed Won",
            "sentiment": "Positive"
        }
    ]

    for item in sample_items:
        db_item = models.Conversation(**item)
        db.add(db_item)
    db.commit()

# Run seed check on startup
@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_sample_data(db)
    finally:
        db.close()

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Revenue Intelligence Inbox API"}

@app.get("/metrics")
@app.get("/stats")
def get_metrics(db: Session = Depends(get_db)):
    return crud.get_revenue_metrics(db)

@app.post("/seed")
def reseed_data(db: Session = Depends(get_db)):
    db.query(models.Conversation).delete()
    db.commit()
    seed_sample_data(db)
    return {"status": "success", "message": "Demo sample conversations reseeded."}

# CRUD endpoints
@app.get("/conversations", response_model=List[schemas.Conversation])
def list_conversations(
    skip: int = 0, 
    limit: int = 100,
    search: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    routing: Optional[str] = Query(None),
    stage: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return crud.get_conversations(
        db, 
        skip=skip, 
        limit=limit, 
        search=search, 
        priority=priority, 
        routing=routing, 
        stage=stage
    )

@app.post("/conversations", response_model=schemas.Conversation)
def create_conversation(payload: schemas.ConversationCreate, db: Session = Depends(get_db)):
    existing = crud.get_conversation_by_source_id(db, payload.source_id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Conversation with source_id '{payload.source_id}' already exists")
    return crud.create_conversation(db, payload)

@app.get("/conversations/{conv_id}", response_model=schemas.Conversation)
def get_conversation(conv_id: int, db: Session = Depends(get_db)):
    conv = crud.get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv

@app.patch("/conversations/{conv_id}", response_model=schemas.Conversation)
def update_conversation(conv_id: int, payload: schemas.ConversationUpdate, db: Session = Depends(get_db)):
    conv = crud.get_conversation(db, conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    updated = crud.update_conversation_partial(db, conv_id, payload)
    return updated

@app.delete("/conversations/{conv_id}")
def delete_conversation(conv_id: int, db: Session = Depends(get_db)):
    success = crud.delete_conversation(db, conv_id)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "success", "deleted_id": conv_id}

@app.post("/import", summary="Import CSV or JSON conversation data")
async def import_conversations(file: UploadFile = File(...), db: Session = Depends(get_db)):
    suffix = Path(file.filename).suffix.lower()
    if suffix not in {".csv", ".json"}:
        raise HTTPException(status_code=400, detail="Unsupported file type. Please upload a .csv or .json file.")
    content = await file.read()
    if suffix == ".csv":
        text_content = content.decode('utf-8', errors='replace')
        reader = csv.DictReader(io.StringIO(text_content))
        rows = list(reader)
    else:
        try:
            rows = json.loads(content)
            if isinstance(rows, dict) and "conversations" in rows:
                rows = rows["conversations"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON format: {str(e)}")

    if not rows or "source_id" not in rows[0]:
        raise HTTPException(status_code=400, detail="Missing required field 'source_id' in data records")

    summary = {"new": 0, "updated": 0, "unchanged": 0, "duplicates": 0, "errors": []}
    for row in rows:
        try:
            conv_data = schemas.ConversationCreate.from_dict(row)
        except Exception as e:
            summary["errors"].append(f"Row {row.get('source_id', 'unknown')}: {str(e)}")
            continue

        existing = crud.get_conversation_by_source_id(db, conv_data.source_id)
        if existing:
            if crud.is_same(existing, conv_data):
                summary["unchanged"] += 1
                continue
            if existing.manual_override:
                summary["duplicates"] += 1
                continue
            crud.update_conversation(db, existing.id, conv_data)
            summary["updated"] += 1
        else:
            crud.create_conversation(db, conv_data)
            summary["new"] += 1
            
    return summary

@app.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    rows = crud.get_all_as_dicts(db)
    if not rows:
        return {"filename": "conversations_export.csv", "content": ""}
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    return {"filename": "conversations_export.csv", "content": output.getvalue()}

@app.get("/export/json")
def export_json(db: Session = Depends(get_db)):
    rows = crud.get_all_as_dicts(db)
    return rows

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
