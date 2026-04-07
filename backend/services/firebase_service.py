import firebase_admin
from firebase_admin import credentials, firestore
import os
from typing import List, Dict, Optional
import time

db = None

def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global db
    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "./serviceAccountKey.json")
    
    if not os.path.exists(cred_path):
        raise FileNotFoundError(
            f"Firebase credentials file not found at {cred_path}. "
            "Please download your service account key from Firebase Console."
        )
    
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully")

def get_firestore_client():
    """Get Firestore client instance"""
    if db is None:
        raise RuntimeError("Firebase not initialized. Call initialize_firebase() first.")
    return db

def store_fingerprint_template(aadhaar_number: str, fingerprint_index: int, template_data: str) -> bool:
    """Store a single fingerprint template in Firestore"""
    try:
        db = get_firestore_client()
        doc_ref = db.collection('fingerprints').document(aadhaar_number)
        
        # Get existing data or create new
        doc = doc_ref.get()
        current_time = int(time.time())
        
        if doc.exists:
            data = doc.to_dict()
            fingerprints = data.get('fingerprints', [])
            
            # Update or add fingerprint
            finger_exists = False
            for fp in fingerprints:
                if fp['index'] == fingerprint_index:
                    fp['template_data'] = template_data
                    fp['updated_at'] = current_time
                    finger_exists = True
                    break
            
            if not finger_exists:
                fingerprints.append({
                    'index': fingerprint_index,
                    'template_data': template_data,
                    'created_at': current_time
                })
            
            doc_ref.update({
                'fingerprints': fingerprints,
                'updated_at': current_time
            })
        else:
            # Create new document
            doc_ref.set({
                'aadhaar_number': aadhaar_number,
                'fingerprints': [{
                    'index': fingerprint_index,
                    'template_data': template_data,
                    'created_at': current_time
                }],
                'enrollment_completed': False,
                'created_at': current_time,
                'updated_at': current_time
            })
        
        return True
    except Exception as e:
        print(f"Error storing fingerprint template: {e}")
        return False

def complete_enrollment(aadhaar_number: str) -> bool:
    """Mark fingerprint enrollment as completed"""
    try:
        db = get_firestore_client()
        doc_ref = db.collection('fingerprints').document(aadhaar_number)
        doc_ref.update({
            'enrollment_completed': True,
            'updated_at': int(time.time())
        })
        return True
    except Exception as e:
        print(f"Error completing enrollment: {e}")
        return False

def get_user_fingerprints(aadhaar_number: str) -> Optional[Dict]:
    """Retrieve all fingerprint templates for a user"""
    try:
        db = get_firestore_client()
        doc_ref = db.collection('fingerprints').document(aadhaar_number)
        doc = doc_ref.get()
        
        if doc.exists:
            return doc.to_dict()
        return None
    except Exception as e:
        print(f"Error retrieving fingerprints: {e}")
        return None

def check_enrollment_status(aadhaar_number: str) -> Dict:
    """Check the enrollment status of a user"""
    try:
        data = get_user_fingerprints(aadhaar_number)
        if not data:
            return {
                'exists': False,
                'completed': False,
                'count': 0
            }
        
        fingerprints = data.get('fingerprints', [])
        return {
            'exists': True,
            'completed': data.get('enrollment_completed', False),
            'count': len(fingerprints)
        }
    except Exception as e:
        print(f"Error checking enrollment status: {e}")
        return {'exists': False, 'completed': False, 'count': 0}

def delete_user_fingerprints(aadhaar_number: str) -> bool:
    """Delete all fingerprint data for a user"""
    try:
        db = get_firestore_client()
        doc_ref = db.collection('fingerprints').document(aadhaar_number)
        doc_ref.delete()
        return True
    except Exception as e:
        print(f"Error deleting fingerprints: {e}")
        return False
