from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from routers import fingerprint
from services.firebase_service import initialize_firebase
from services.sensor_service import initialize_sensor, cleanup_sensor

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    initialize_firebase()
    initialize_sensor()
    yield
    # Shutdown
    cleanup_sensor()

app = FastAPI(
    title="E-Voting Biometric API",
    description="FastAPI backend for fingerprint-based voter authentication",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(fingerprint.router, prefix="/api/fingerprint", tags=["fingerprint"])

@app.get("/")
async def root():
    return {
        "message": "E-Voting Biometric API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
