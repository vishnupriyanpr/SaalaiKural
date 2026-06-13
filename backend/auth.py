from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import database
import models
import firebase_service

security = HTTPBearer()

def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        decoded_token = firebase_service.verify_token(token)
        return decoded_token["uid"]
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(user_id: str = Depends(get_current_user_id), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

# Role Dependencies
get_citizen = require_role(["Citizen", "Authority", "Admin"])
get_authority = require_role(["Authority", "Admin"])
get_admin = require_role(["Admin"])
