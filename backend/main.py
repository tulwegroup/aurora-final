from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import os

app = FastAPI(
    title="Aurora OSI API",
    description="Planetary Subsurface Intelligence Backend",
    version="0.1.0"
)

# Allow frontend access (tighten later for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Data Models
# -----------------------------

class ScanRequest(BaseModel):
    latitude: float
    longitude: float
    target: str  # e.g. "gold", "helium", "hydrocarbon"


# -----------------------------
# Core Health & Meta Endpoints
# -----------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Aurora OSI Backend",
        "env": os.getenv("RENDER_SERVICE_NAME", "local")
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.get("/api/v1/meta")
def meta():
    """
    Frontend connectivity & contract endpoint.
    Safe, static, non-sensitive.
    """
    return {
        "service": "Aurora OSI Backend",
        "status": "online",
        "version": "0.1.0",
        "engine": "Aurora OSI v3 (placeholder)",
        "env": os.getenv("RENDER_SERVICE_NAME", "local")
    }


# -----------------------------
# Scan Endpoint (Placeholder)
# -----------------------------

@app.post("/scan")
def run_scan(req: ScanRequest):
    """
    Placeholder scan endpoint.
    This will later call the real Aurora physics + AI engine.
    """
    probability = round(random.uniform(0.6, 0.95), 3)

    return {
        "target": req.target,
        "location": {
            "lat": req.latitude,
            "lon": req.longitude
        },
        "probability": probability,
        "confidence_band": "HIGH" if probability > 0.85 else "MEDIUM",
        "engine": "Aurora OSI v3 (placeholder)"
    }
