from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.api.v1.router import api_router
from app.db.base import Base
from app.db.init_db import init_guest_user, init_admin_user
from app.db.session import engine
from contextlib import asynccontextmanager
from app.db.session import AsyncSessionLocal
from app.core.exceptions import (
    global_exception_handler,
    validation_exception_handler
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not settings.TESTING:
        async with engine.begin() as conn:
            # Create all tables if not exists
            await conn.run_sync(Base.metadata.create_all)

        # Initialize application data
        async with AsyncSessionLocal() as db:
            await init_guest_user(db)
            await init_admin_user(db)

    # Yield control to the application
    yield


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        lifespan=lifespan,
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