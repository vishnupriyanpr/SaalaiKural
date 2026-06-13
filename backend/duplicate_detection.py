import math
from datetime import datetime

class DuplicateDetection:
    @staticmethod
    def haversine(lat1, lon1, lat2, lon2):
        # Earth radius in meters
        R = 6371000 
        
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = math.sin(delta_phi / 2.0) ** 2 + \
            math.cos(phi1) * math.cos(phi2) * \
            math.sin(delta_lambda / 2.0) ** 2
            
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        distance = R * c
        return distance

    @staticmethod
    def is_duplicate(new_complaint, existing_complaints) -> bool:
        """
        Duplicate if:
        - Same damage type
        - Within 50 meters
        - Within 7 days
        """
        for complaint in existing_complaints:
            if complaint.damage_type != new_complaint.damage_type:
                continue
                
            distance = DuplicateDetection.haversine(
                new_complaint.latitude, new_complaint.longitude,
                complaint.latitude, complaint.longitude
            )
            
            if distance <= 50:
                time_diff = (datetime.utcnow() - complaint.created_at).days
                if time_diff <= 7:
                    return True
                    
        return False

duplicate_detection = DuplicateDetection()
