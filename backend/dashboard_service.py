from sqlalchemy.orm import Session
from sqlalchemy import func
import models

class DashboardService:
    @staticmethod
    def get_stats(db: Session):
        total_complaints = db.query(models.Complaint).count()
        pending = db.query(models.Complaint).filter(models.Complaint.status == "Pending").count()
        in_progress = db.query(models.Complaint).filter(models.Complaint.status == "In Progress").count()
        resolved = db.query(models.Complaint).filter(models.Complaint.status == "Resolved").count()
        critical = db.query(models.Complaint).filter(models.Complaint.priority_category == "Critical").count()

        return {
            "total_complaints": total_complaints,
            "pending": pending,
            "in_progress": in_progress,
            "resolved": resolved,
            "critical": critical
        }

    @staticmethod
    def get_complaints(db: Session, status: str = None, category: str = None, skip: int = 0, limit: int = 100):
        query = db.query(models.Complaint)
        
        if status:
            query = query.filter(models.Complaint.status == status)
        if category:
            query = query.filter(models.Complaint.priority_category == category)
            
        return query.order_by(models.Complaint.created_at.desc()).offset(skip).limit(limit).all()

dashboard_service = DashboardService()
