from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="Citizen") # Citizen, Authority, Admin
    points = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaints = relationship("Complaint", back_populates="user")
    rewards = relationship("Reward", back_populates="user")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    image_path = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    damage_type = Column(String) # Crack, Pothole
    confidence = Column(Float)
    severity = Column(Float)
    severity_category = Column(String) # Low, Medium, High, Critical
    priority = Column(Float)
    priority_category = Column(String) # Low, Medium, High, Critical
    status = Column(String, default="Pending") # Pending, Under Review, Assigned, In Progress, Resolved
    is_duplicate = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="complaints")
    repair_updates = relationship("RepairUpdate", back_populates="complaint", cascade="all, delete")


class RepairUpdate(Base):
    __tablename__ = "repair_updates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"))
    repair_image_path = Column(String)
    remarks = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="repair_updates")


class Reward(Base):
    __tablename__ = "rewards"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String, ForeignKey("users.id"))
    points = Column(Integer)
    badge = Column(String)

    user = relationship("User", back_populates="rewards")
