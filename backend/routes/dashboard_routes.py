from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
from typing import List
import os

import models
import schemas
import database
import auth
from dashboard_service import dashboard_service
from analytics_service import analytics_service
from map_service import map_service

router = APIRouter(tags=["dashboard", "analytics", "maps"])

# Dashboard Routes
@router.get("/dashboard/stats")
def get_dashboard_stats(db: Session = Depends(database.get_db)):
    return dashboard_service.get_stats(db)

@router.get("/dashboard/all", response_model=List[schemas.ComplaintOut])
def get_all_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return dashboard_service.get_complaints(db, skip=skip, limit=limit)

@router.get("/dashboard/critical", response_model=List[schemas.ComplaintOut])
def get_critical_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return dashboard_service.get_complaints(db, category="Critical", skip=skip, limit=limit)

@router.get("/dashboard/pending", response_model=List[schemas.ComplaintOut])
def get_pending_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return dashboard_service.get_complaints(db, status="Pending", skip=skip, limit=limit)

@router.get("/dashboard/resolved", response_model=List[schemas.ComplaintOut])
def get_resolved_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return dashboard_service.get_complaints(db, status="Resolved", skip=skip, limit=limit)

# Analytics Route
@router.get("/analytics")
def get_analytics(db: Session = Depends(database.get_db)):
    return analytics_service.get_analytics(db)

# Maps Routes
@router.get("/map")
def get_map(db: Session = Depends(database.get_db)):
    map_path = map_service.generate_map(db)
    if os.path.exists(map_path):
        return FileResponse(map_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="Map could not be generated")

@router.get("/heatmap")
def get_heatmap(db: Session = Depends(database.get_db)):
    map_path = map_service.generate_heatmap(db)
    if os.path.exists(map_path):
        return FileResponse(map_path, media_type="text/html")
    raise HTTPException(status_code=404, detail="Heatmap could not be generated")
