from pydantic import BaseModel, Field
from typing import List, Optional

class EnrollmentStartRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12, pattern=r'^\d{12}$')

class EnrollmentStartResponse(BaseModel):
    message: str
    total_fingerprints: int
    current_fingerprint: int
    aadhaar_number: str

class EnrollFingerprintRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12, pattern=r'^\d{12}$')
    fingerprint_index: int = Field(..., ge=0, le=9)

class EnrollFingerprintResponse(BaseModel):
    success: bool
    message: str
    fingerprint_index: int
    next_fingerprint: Optional[int] = None
    completed: bool = False

class EnrollmentCompleteRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12, pattern=r'^\d{12}$')

class EnrollmentCompleteResponse(BaseModel):
    success: bool
    message: str
    total_enrolled: int

class VerifyFingerprintRequest(BaseModel):
    aadhaar_number: str = Field(..., min_length=12, max_length=12, pattern=r'^\d{12}$')

class VerifyFingerprintResponse(BaseModel):
    success: bool
    message: str
    matched: bool
    confidence: Optional[int] = None
    matched_finger_index: Optional[int] = None

class FingerprintTemplate(BaseModel):
    index: int
    template_data: str
    created_at: int

class UserFingerprints(BaseModel):
    aadhaar_number: str
    fingerprints: List[FingerprintTemplate]
    enrollment_completed: bool
    created_at: int
    updated_at: int
