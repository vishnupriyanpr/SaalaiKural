from sqlalchemy.orm import Session
import models

class RewardService:
    @staticmethod
    def get_badge(points: int) -> str:
        if points < 50:
            return "Bronze Reporter"
        elif points < 150:
            return "Silver Reporter"
        elif points < 300:
            return "Gold Reporter"
        else:
            return "Road Guardian"

    @staticmethod
    def add_points(db: Session, user_id: str, action: str):
        """
        Verified Complaint: 10 Points
        Resolved Complaint: 20 Points
        """
        points_to_add = 0
        if action == "Verified Complaint":
            points_to_add = 10
        elif action == "Resolved Complaint":
            points_to_add = 20

        if points_to_add > 0:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                user.points += points_to_add
                
                # Check if we need to update/create reward entry
                reward = db.query(models.Reward).filter(models.Reward.user_id == user_id).first()
                if not reward:
                    reward = models.Reward(user_id=user_id, points=user.points, badge=RewardService.get_badge(user.points))
                    db.add(reward)
                else:
                    reward.points = user.points
                    reward.badge = RewardService.get_badge(user.points)
                
                db.commit()

reward_service = RewardService()
