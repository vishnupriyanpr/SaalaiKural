from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    name: str
    email: str

class UserCreate(UserBase):
    password: str # This is for Firebase auth, but we might accept it here to register via our API if we wrap it, or just accept the firebase UID.
    role: str = "Citizen"

class UserRegisterRequest(BaseModel):
    token: str # Firebase ID token
    role: str = "Citizen"

class UserLoginRequest(BaseModel):
    token: str # Firebase ID token

class UserOut(UserBase):
    id: str
    role: str
    points: int
    created_at: datetime

    class Config:
        from_attributes = True

# Complaint Schemas
class ComplaintBase(BaseModel):
    latitude: float
    longitude: float

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintOut(ComplaintBase):
    id: int
    user_id: str
    image_path: str
    damage_type: str
    confidence: float
    severity: float
    severity_category: str
    priority: float
    priority_category: str
    status: str
    is_duplicate: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ComplaintStatusUpdate(BaseModel):
    status: str # Pending, Under Review, Assigned, In Progress, Resolved

# Repair Schemas
class RepairUpdateOut(BaseModel):
    id: int
    complaint_id: int
    repair_image_path: str
    remarks: str
    updated_at: datetime

    class Config:
        from_attributes = True

# Reward Schemas
class RewardOut(BaseModel):
    id: int
    user_id: str
    points: int
    badge: str

    class Config:
        from_attributes = True

class LeaderboardEntry(BaseModel):
    id: str
    name: str
    points: int
    badge: str
