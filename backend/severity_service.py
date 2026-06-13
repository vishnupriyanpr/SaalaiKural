import math

class SeverityService:
    @staticmethod
    def calculate_severity(bbox: list, image_area: float, confidence: float, damage_type: str) -> dict:
        """
        Formula:
        severity = sqrt(area_ratio) * confidence * damage_weight * 100
        area_ratio = bbox_area / image_area
        Weights: Crack = 0.8, Pothole = 1.0
        Categories: 0-25=Low, 26-50=Medium, 51-75=High, 76-100=Critical
        """
        if not bbox or len(bbox) != 4 or image_area <= 0:
            return {"severity": 0.0, "category": "Low"}
            
        x1, y1, x2, y2 = bbox
        bbox_area = max(0, x2 - x1) * max(0, y2 - y1)
        
        area_ratio = min(1.0, bbox_area / image_area)
        
        damage_weight = 1.0 if damage_type.lower() == "pothole" else 0.8
        
        severity_score = math.sqrt(area_ratio) * confidence * damage_weight * 100
        
        # Cap severity at 100
        severity_score = min(100.0, max(0.0, severity_score))
        
        category = "Low"
        if severity_score > 75:
            category = "Critical"
        elif severity_score > 50:
            category = "High"
        elif severity_score > 25:
            category = "Medium"
            
        return {
            "severity": round(severity_score, 2),
            "category": category
        }

severity_service = SeverityService()
