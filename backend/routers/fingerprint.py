from fastapi import APIRouter, HTTPException, BackgroundTasks
from models.schemas import (
    EnrollmentStartRequest,
    EnrollmentStartResponse,
    EnrollFingerprintRequest,
    EnrollFingerprintResponse,
    EnrollmentCompleteRequest,
    EnrollmentCompleteResponse,
    VerifyFingerprintRequest,
    VerifyFingerprintResponse
)
from services.sensor_service import (
    enroll_fingerprint,
    verify_fingerprint_with_templates,
    delete_template_from_sensor
)
from services.firebase_service import (
    store_fingerprint_template,
    complete_enrollment,
    get_user_fingerprints,
    check_enrollment_status
)

router = APIRouter()

# Constants
TOTAL_FINGERPRINTS_REQUIRED = 10
SENSOR_STORAGE_START_POSITION = 100  # Start storing templates from position 100

@router.post("/enroll/start", response_model=EnrollmentStartResponse)
async def start_enrollment(request: EnrollmentStartRequest):
    """
    Initialize fingerprint enrollment for a user.
    Checks if user already has enrolled fingerprints.
    """
    status = check_enrollment_status(request.aadhaar_number)
    
    if status['completed']:
        raise HTTPException(
            status_code=400,
            detail="User has already completed fingerprint enrollment"
        )
    
    return EnrollmentStartResponse(
        message="Fingerprint enrollment started. Please scan 10 different fingers.",
        total_fingerprints=TOTAL_FINGERPRINTS_REQUIRED,
        current_fingerprint=status['count'],
        aadhaar_number=request.aadhaar_number
    )

@router.post("/enroll/capture", response_model=EnrollFingerprintResponse)
async def capture_fingerprint(request: EnrollFingerprintRequest):
    """
    Capture and enroll a single fingerprint.
    This endpoint should be called 10 times with fingerprint_index from 0-9.
    """
    if request.fingerprint_index < 0 or request.fingerprint_index >= TOTAL_FINGERPRINTS_REQUIRED:
        raise HTTPException(
            status_code=400,
            detail=f"Fingerprint index must be between 0 and {TOTAL_FINGERPRINTS_REQUIRED - 1}"
        )
    
    # Calculate sensor storage position for this fingerprint
    # Using aadhaar last 4 digits + index to create unique position
    aadhaar_suffix = int(request.aadhaar_number[-4:])
    sensor_position = SENSOR_STORAGE_START_POSITION + (aadhaar_suffix * 100) + request.fingerprint_index
    
    # Enroll the fingerprint using the sensor
    success, message, template_data = enroll_fingerprint(sensor_position)
    
    if not success:
        raise HTTPException(status_code=500, detail=message)
    
    if not template_data:
        raise HTTPException(status_code=500, detail="Failed to extract template data")
    
    # Store in Firestore
    stored = store_fingerprint_template(
        request.aadhaar_number,
        request.fingerprint_index,
        template_data
    )
    
    if not stored:
        # Cleanup sensor storage if Firestore fails
        delete_template_from_sensor(sensor_position)
        raise HTTPException(status_code=500, detail="Failed to store fingerprint in database")
    
    # Check if this was the last fingerprint
    next_index = request.fingerprint_index + 1
    completed = next_index >= TOTAL_FINGERPRINTS_REQUIRED
    
    return EnrollFingerprintResponse(
        success=True,
        message=f"Fingerprint {request.fingerprint_index + 1}/{TOTAL_FINGERPRINTS_REQUIRED} enrolled successfully",
        fingerprint_index=request.fingerprint_index,
        next_fingerprint=next_index if not completed else None,
        completed=completed
    )

@router.post("/enroll/complete", response_model=EnrollmentCompleteResponse)
async def complete_fingerprint_enrollment(request: EnrollmentCompleteRequest):
    """
    Mark the enrollment process as complete after all 10 fingerprints are captured.
    """
    status = check_enrollment_status(request.aadhaar_number)
    
    if not status['exists']:
        raise HTTPException(
            status_code=404,
            detail="No fingerprint enrollment found for this user"
        )
    
    if status['count'] < TOTAL_FINGERPRINTS_REQUIRED:
        raise HTTPException(
            status_code=400,
            detail=f"Only {status['count']}/{TOTAL_FINGERPRINTS_REQUIRED} fingerprints enrolled. Please complete all enrollments."
        )
    
    if status['completed']:
        return EnrollmentCompleteResponse(
            success=True,
            message="Enrollment already completed",
            total_enrolled=status['count']
        )
    
    # Mark as complete in Firestore
    success = complete_enrollment(request.aadhaar_number)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to complete enrollment")
    
    return EnrollmentCompleteResponse(
        success=True,
        message="Fingerprint enrollment completed successfully",
        total_enrolled=status['count']
    )

@router.post("/verify", response_model=VerifyFingerprintResponse)
async def verify_fingerprint(request: VerifyFingerprintRequest):
    """
    Verify a fingerprint against enrolled fingerprints for the given Aadhaar number.
    """
    # Get user's fingerprint templates from Firestore
    user_data = get_user_fingerprints(request.aadhaar_number)
    
    if not user_data:
        raise HTTPException(
            status_code=404,
            detail="No fingerprint data found for this user. Please register first."
        )
    
    if not user_data.get('enrollment_completed', False):
        raise HTTPException(
            status_code=400,
            detail="Fingerprint enrollment not completed for this user"
        )
    
    fingerprints = user_data.get('fingerprints', [])
    
    if len(fingerprints) < TOTAL_FINGERPRINTS_REQUIRED:
        raise HTTPException(
            status_code=400,
            detail=f"User has only {len(fingerprints)}/{TOTAL_FINGERPRINTS_REQUIRED} fingerprints enrolled"
        )
    
    # Verify against stored templates
    matched, confidence, matched_index = verify_fingerprint_with_templates(fingerprints)
    
    if matched:
        return VerifyFingerprintResponse(
            success=True,
            message="Fingerprint verified successfully",
            matched=True,
            confidence=confidence,
            matched_finger_index=matched_index
        )
    else:
        return VerifyFingerprintResponse(
            success=True,
            message="Fingerprint does not match",
            matched=False,
            confidence=confidence,
            matched_finger_index=None
        )

@router.get("/status/{aadhaar_number}")
async def get_enrollment_status(aadhaar_number: str):
    """
    Get the enrollment status for a user.
    """
    if len(aadhaar_number) != 12 or not aadhaar_number.isdigit():
        raise HTTPException(status_code=400, detail="Invalid Aadhaar number")
    
    status = check_enrollment_status(aadhaar_number)
    
    return {
        "aadhaar_number": aadhaar_number,
        "has_enrollment": status['exists'],
        "enrollment_completed": status['completed'],
        "fingerprints_enrolled": status['count'],
        "total_required": TOTAL_FINGERPRINTS_REQUIRED
    }
