from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
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


# =====================================================
# USHE — Unified Spectral & Harmonic Engine (LIVE STUB)
# =====================================================

@app.get("/api/v1/ushe/sample")
def get_ushe_sample(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    radius_km: float = Query(25, description="Sampling radius in km")
):
    """
    USHE satellite-derived spectral sample.
    Structured exactly like live Sentinel / GEE output.
    """

    wavelengths = list(range(400, 2501, 50))
    spectral = []

    for w in wavelengths:
        spectral.append({
            "wavelength": w,
            "Optical": round(0.35 + (w % 300) * 0.0004, 4),
            "SAR": round(0.22 + (w % 200) * 0.0003, 4),
            "Thermal": round(0.45 + (w % 400) * 0.0002, 4),
            "Gravity": round(0.30 + (w % 500) * 0.00015, 4),
            "Fused": round(0.55 + (w % 250) * 0.0005, 4),
        })

    calibration_logs = [
        {
            "id": f"log-{i}",
            "timestamp": datetime.utcnow().isoformat(),
            "region_id": f"tile-{i}",
            "reference_count": 100 + i * 12
        }
        for i in range(5)
    ]

    return {
        "location": {
            "lat": lat,
            "lon": lon,
            "radius_km": radius_km
        },
        "spectral": spectral,
        "calibration_logs": calibration_logs,
        "source": "Sentinel-1 / Sentinel-2 (USHE)",
        "engine": "Aurora USHE v1.0"
    }
