"""
FastAPI application for the AES educational tool.

All cryptographic operations run client-side in the browser, so this backend
only handles authentication (register/login/logout/me) and basic health checks.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from .auth import models as _auth_models  # noqa: F401  (register User table on Base)
from .auth.routes import router as auth_router
from .db import Base, engine
from .limiter import limiter

app = FastAPI(
    title="AES Modes Educational Tool",
    description=(
        "Authentication backend for the AES educational tool. "
        "All AES operations run client-side in the user's browser."
    ),
    version="2.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _create_tables() -> None:
    Base.metadata.create_all(bind=engine)


app.include_router(auth_router)


@app.get("/")
async def root():
    return {
        "message": "AES Modes Educational Tool — auth backend",
        "version": "2.0.0",
        "note": "AES operations run entirely in the frontend; this API only handles auth.",
    }
