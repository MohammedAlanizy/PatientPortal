from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import IntegrityError

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = [
        {
            "field": ".".join(error.get("loc", [])),
            "message": error.get("msg"),
            "type": error.get("type")
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": errors}
    )

async def pydantic_validation_error_handler(request: Request, exc: ValidationError):
    errors = [
        {
            "field": ".".join(error.get("loc", [])),
            "message": error.get("msg"),
            "type": error.get("type")
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content={"detail": "Validation failed", "errors": errors}
    )

async def global_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, RequestValidationError):
        return await validation_exception_handler(request, exc)
    elif isinstance(exc, ValidationError):
        return await pydantic_validation_error_handler(request, exc)
    elif isinstance(exc, IntegrityError):
        return JSONResponse(
            status_code=400,
            content={"detail": "Database integrity error", "error": str(exc.orig)},
        )
    elif isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail},
        )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )
