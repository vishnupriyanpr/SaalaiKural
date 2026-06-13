from sqlalchemy.orm import Session
from sqlalchemy import func, extract
import models

class AnalyticsService:
    @staticmethod
    def get_analytics(db: Session):
        total_count = db.query(models.Complaint).count()
        
        # Damage Distribution
        damage_dist = db.query(
            models.Complaint.damage_type, 
            func.count(models.Complaint.id)
        ).group_by(models.Complaint.damage_type).all()
        
        # Severity Distribution
        severity_dist = db.query(
            models.Complaint.severity_category, 
            func.count(models.Complaint.id)
        ).group_by(models.Complaint.severity_category).all()
        
        # Monthly Trends (Simple implementation for sqlite)
        # Using substr for YYYY-MM
        monthly_trends = db.query(
            func.substr(models.Complaint.created_at, 1, 7).label('month'),
            func.count(models.Complaint.id)
        ).group_by('month').all()
        
        # Resolution Rate
        resolved_count = db.query(models.Complaint).filter(models.Complaint.status == "Resolved").count()
        resolution_rate = (resolved_count / total_count * 100) if total_count > 0 else 0
        
        return {
            "complaint_count": total_count,
            "damage_distribution": {k: v for k, v in damage_dist},
            "severity_distribution": {k: v for k, v in severity_dist},
            "monthly_trends": {k: v for k, v in monthly_trends},
            "resolution_rate": round(resolution_rate, 2),
            "heatmap_statistics": {
                "critical_areas": db.query(models.Complaint).filter(models.Complaint.priority_category == "Critical").count(),
                "high_areas": db.query(models.Complaint).filter(models.Complaint.priority_category == "High").count(),
            }
        }

analytics_service = AnalyticsService()
