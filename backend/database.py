# backend/database.py
import os
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

BASE_DIR = Path(__file__).parent
DB_PATH = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'app.db'}")
engine = create_engine(DB_PATH, **({"connect_args": {"check_same_thread": False}} if DB_PATH.startswith("sqlite" ) else {}))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
