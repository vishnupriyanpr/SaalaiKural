import random

class PriorityService:
    @staticmethod
    def calculate_priority(severity: float, report_score: float = 10.0, pending_score: float = 10.0) -> dict:
        """
        Formula:
        priority = (severity * 0.6) + report_score + road_importance + pending_score
        Defaults: report_score=10, pending_score=10
        Categories: 0-30=Low, 31-60=Medium, 61-80=High, 81-100=Critical
        """
        # Mock road importance based on map geocoding simulation
        # For a real implementation, you'd use a geocoding service (like OSM/Google Maps)
        road_importances = [
            ("School", 20),
            ("Hospital", 20),
            ("Main Road", 15),
            ("Bus Route", 15),
            ("Residential", 10)
        ]
        
        # Simulating finding the road type for demo purposes
        road_type, road_importance = random.choice(road_importances)
        
        priority_score = (severity * 0.6) + report_score + road_importance + pending_score
        
        # Cap priority at 100
        priority_score = min(100.0, max(0.0, priority_score))
        
        category = "Low"
        if priority_score > 80:
            category = "Critical"
        elif priority_score > 60:
            category = "High"
        elif priority_score > 30:
            category = "Medium"
            
        return {
            "priority": round(priority_score, 2),
            "category": category,
            "road_type": road_type
        }

priority_service = PriorityService()
