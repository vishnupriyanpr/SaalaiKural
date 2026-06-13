import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase Admin SDK
cred_path = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.get_app()
    except ValueError:
        firebase_admin.initialize_app(cred)
else:
    print(f"WARNING: Firebase credentials not found at {cred_path}. Authentication will fail.")

def verify_token(id_token: str):
    """
    Verifies the Firebase ID token and returns the decoded token.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except Exception as e:
        raise ValueError(f"Invalid Firebase ID token: {e}")

def get_user_by_email(email: str):
    try:
        user = auth.get_user_by_email(email)
        return user
    except Exception as e:
        return None
