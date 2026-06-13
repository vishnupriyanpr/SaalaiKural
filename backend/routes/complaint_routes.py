from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

import models
import schemas
import database
import auth
from complaint_service import complaint_service
from reward_service import reward_service

router = APIRouter(tags=["complaints"])

@router.post("/complaints/report", response_model=schemas.ComplaintOut)
def report_complaint(
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_citizen),
    db: Session = Depends(database.get_db)
):
    try:
        complaint = complaint_service.process_complaint(
            db=db,
            user_id=current_user.id,
            latitude=latitude,
            longitude=longitude,
            image=image
        )
        return complaint
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/complaints", response_model=List[schemas.ComplaintOut])
def get_complaints(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    complaints = db.query(models.Complaint).offset(skip).limit(limit).all()
    return complaints

@router.get("/complaints/{id}", response_model=schemas.ComplaintOut)
def get_complaint(id: int, db: Session = Depends(database.get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint

@router.get("/complaints/user/{user_id}", response_model=List[schemas.ComplaintOut])
def get_user_complaints(user_id: str, db: Session = Depends(database.get_db)):
    complaints = db.query(models.Complaint).filter(models.Complaint.user_id == user_id).all()
    return complaints

@router.put("/complaints/update-status/{id}", response_model=schemas.ComplaintOut)
def update_status(
    id: int, 
    status_update: schemas.ComplaintStatusUpdate,
    current_user: models.User = Depends(auth.get_authority),
    db: Session = Depends(database.get_db)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    complaint.status = status_update.status
    db.commit()
    db.refresh(complaint)
    
    # Add rewards if resolved
    if complaint.status == "Resolved" and not complaint.is_duplicate:
        reward_service.add_points(db, complaint.user_id, "Resolved Complaint")
        
    return complaint

@router.delete("/complaints/{id}")
def delete_complaint(id: int, current_user: models.User = Depends(auth.get_admin), db: Session = Depends(database.get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    db.delete(complaint)
    db.commit()
    return {"message": "Complaint deleted successfully"}

# Repairs Routes
@router.put("/repairs/update/{complaint_id}", response_model=schemas.RepairUpdateOut)
def update_repair(
    complaint_id: int,
    remarks: str = Form(...),
    image: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_authority),
    db: Session = Depends(database.get_db)
):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", "repairs")
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, image.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
        
    repair_update = models.RepairUpdate(
        complaint_id=complaint_id,
        repair_image_path=file_path,
        remarks=remarks
    )
    
    db.add(repair_update)
    
    # Auto update status to In Progress
    if complaint.status == "Pending" or complaint.status == "Assigned":
        complaint.status = "In Progress"
        
    db.commit()
    db.refresh(repair_update)
    
    return repair_update

# Tracking Routes
@router.get("/track/{complaint_id}")
def track_complaint(complaint_id: int, db: Session = Depends(database.get_db)):
    complaint = db.query(models.Complaint).filter(models.Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    updates = db.query(models.RepairUpdate).filter(models.RepairUpdate.complaint_id == complaint_id).all()
    
    return {
        "complaint": complaint,
        "updates": updates
    }

# Rewards Routes
@router.get("/rewards/{user_id}", response_model=schemas.RewardOut)
def get_user_rewards(user_id: str, db: Session = Depends(database.get_db)):
    reward = db.query(models.Reward).filter(models.Reward.user_id == user_id).first()
    if not reward:
        # Return 0 points if no reward entry
        return {"id": 0, "user_id": user_id, "points": 0, "badge": "Bronze Reporter"}
    return reward

@router.get("/leaderboard", response_model=List[schemas.LeaderboardEntry])
def get_leaderboard(db: Session = Depends(database.get_db)):
    users = db.query(models.User).order_by(models.User.points.desc()).limit(10).all()
    
    leaderboard = []
    for user in users:
        reward = db.query(models.Reward).filter(models.Reward.user_id == user.id).first()
        badge = reward.badge if reward else "Bronze Reporter"
        leaderboard.append({
            "id": user.id,
            "name": user.name,
            "points": user.points,
            "badge": badge
        })
        
    return leaderboard
