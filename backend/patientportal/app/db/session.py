from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from core.config import settings
from sqlalchemy.engine import Engine

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, echo=True)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    # Only apply if using SQLite
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
