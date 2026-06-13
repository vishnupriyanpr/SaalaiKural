import os
import shutil
from fastapi import UploadFile, HTTPException
from sqlalchemy.orm import Session
import models
import schemas
from yolo_service import yolo_service
from severity_service import severity_service
from priority_service import priority_service
from duplicate_detection import duplicate_detection
from reward_service import reward_service

class ComplaintService:
    @staticmethod
    def process_complaint(db: Session, user_id: str, latitude: float, longitude: float, image: UploadFile):
        # 1. Save Image
        upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        
        file_path = os.path.join(upload_dir, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
            
        # 2. Run YOLO
        detection = yolo_service.predict(file_path)
        
        damage_type = detection.get("damage_type", "Unknown")
        confidence = detection.get("confidence", 0.0)
        bbox = detection.get("bbox", [])
        image_area = detection.get("image_area", 1.0)
        
        # 3. Calculate Severity
        severity_result = severity_service.calculate_severity(bbox, image_area, confidence, damage_type)
        severity = severity_result["severity"]
        severity_category = severity_result["category"]
        
        # 4. Calculate Priority
        priority_result = priority_service.calculate_priority(severity)
        priority = priority_result["priority"]
        priority_category = priority_result["category"]
        
        # 5. Detect Duplicate
        existing_complaints = db.query(models.Complaint).all()
        
        # Create temporary complaint object for duplicate check
        temp_complaint = models.Complaint(
            latitude=latitude, 
            longitude=longitude, 
            damage_type=damage_type
        )
        
        is_duplicate = duplicate_detection.is_duplicate(temp_complaint, existing_complaints)
        
        # 6. Store Database Record
        db_complaint = models.Complaint(
            user_id=user_id,
            image_path=file_path,
            latitude=latitude,
            longitude=longitude,
            damage_type=damage_type,
            confidence=confidence,
            severity=severity,
            severity_category=severity_category,
            priority=priority,
            priority_category=priority_category,
            status="Pending",
            is_duplicate=is_duplicate
        )
        
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        
        # Reward points if not duplicate
        if not is_duplicate:
            reward_service.add_points(db, user_id, "Verified Complaint")
            
        return db_complaint

complaint_service = ComplaintService()
