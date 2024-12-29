from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from core.config import settings
from api.v1.router import api_router
from db.base import Base
from db.init_db import init_guest_user, init_admin_user
from db.session import engine, SessionLocal
from core.exceptions import (
    global_exception_handler,
    validation_exception_handler
)

def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
    )
    
    # CORS configuration
    origins = [
        settings.FRONTEND_URL,
    ]
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
        max_age=3600,
    )
    
    app.include_router(api_router, prefix=settings.API_V1_STR)
    app.add_exception_handler(Exception, global_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    return app

app = create_application()

@app.on_event("startup")
async def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # This will create a guest user and an admin user if they don't exist as it should be always one admin account and one guest account 
        # in the system. The admin account is created with the username and password specified in the .env
        init_guest_user(db)
        init_admin_user(db)
    finally:
        db.close()