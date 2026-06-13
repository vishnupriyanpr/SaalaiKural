from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import models
import schemas
import database
import auth
import firebase_service

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=schemas.UserOut)
def register(request: schemas.UserRegisterRequest, db: Session = Depends(database.get_db)):
    try:
        decoded_token = firebase_service.verify_token(request.token)
        uid = decoded_token["uid"]
        email = decoded_token.get("email", "")
        name = decoded_token.get("name", "User")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.id == uid).first()
        if user:
            return user
            
        new_user = models.User(
            id=uid,
            email=email,
            name=name,
            role=request.role
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=schemas.UserOut)
def login(request: schemas.UserLoginRequest, db: Session = Depends(database.get_db)):
    try:
        decoded_token = firebase_service.verify_token(request.token)
        uid = decoded_token["uid"]
        
        user = db.query(models.User).filter(models.User.id == uid).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not registered in database")
            
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/profile", response_model=schemas.UserOut)
def get_profile(current_user: models.User = Depends(auth.get_citizen)):
    return current_user
