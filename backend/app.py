from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
import database
from routes import auth_routes
from routes import complaint_routes
from routes import dashboard_routes
from routes import chatbot_routes
import os
from fastapi.staticfiles import StaticFiles

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="AI-Powered Road Transparency API",
    description="API for public road monitoring system with YOLOv8 damage detection.",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create necessary directories
os.makedirs(os.path.join(os.path.dirname(__file__), "uploads", "repairs"), exist_ok=True)
os.makedirs(os.path.join(os.path.dirname(__file__), "models"), exist_ok=True)

# Include routers
app.include_router(auth_routes.router)
app.include_router(complaint_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(chatbot_routes.router)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "uploads")), name="uploads")

@app.get("/")
def root():
    return {"message": "Welcome to AI-Powered Road Transparency API"}
