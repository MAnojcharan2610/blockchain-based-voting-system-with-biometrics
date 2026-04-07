from pyfingerprint.pyfingerprint import PyFingerprint
import os
import time
from typing import Optional, Tuple

sensor = None

def initialize_sensor():
    """Initialize the R304 fingerprint sensor"""
    global sensor
    try:
        port = os.getenv("SENSOR_PORT", "/dev/ttyUSB0")
        baud_rate = int(os.getenv("SENSOR_BAUD_RATE", 57600))
        address = int(os.getenv("SENSOR_ADDRESS", "0xFFFFFFFF"), 16)
        password = int(os.getenv("SENSOR_PASSWORD", "0x00000000"), 16)
        
        sensor = PyFingerprint(port, baud_rate, address, password)
        
        if not sensor.verifyPassword():
            raise ValueError("Fingerprint sensor password is incorrect!")
        
        print(f"Fingerprint sensor initialized successfully")
        print(f"Storage capacity: {sensor.getStorageCapacity()}")
        print(f"Templates stored: {sensor.getTemplateCount()}")
        
    except Exception as e:
        print(f"Error initializing fingerprint sensor: {e}")
        print("Make sure the sensor is connected and accessible")
        sensor = None

def get_sensor():
    """Get the sensor instance"""
    if sensor is None:
        raise RuntimeError("Fingerprint sensor not initialized")
    return sensor

def cleanup_sensor():
    """Cleanup sensor resources"""
    global sensor
    if sensor:
        try:
            # No specific cleanup needed for pyfingerprint
            sensor = None
            print("Sensor cleaned up")
        except Exception as e:
            print(f"Error cleaning up sensor: {e}")

def read_fingerprint(timeout: int = 10) -> Optional[int]:
    """
    Wait for finger to be placed on sensor and read it.
    Returns the position in sensor buffer (1 or 2) where the image is stored.
    """
    try:
        s = get_sensor()
        print("Waiting for finger...")
        
        # Wait for finger to be placed
        start_time = time.time()
        while not s.readImage():
            if time.time() - start_time > timeout:
                return None
            time.sleep(0.1)
        
        # Convert image to characteristics and store in buffer 1
        s.convertImage(0x01)
        return 1
        
    except Exception as e:
        print(f"Error reading fingerprint: {e}")
        return None

def enroll_fingerprint(position: int, attempts: int = 2) -> Tuple[bool, str, Optional[str]]:
    """
    Enroll a new fingerprint by reading it multiple times.
    
    Args:
        position: Storage position in sensor (0-999 typically)
        attempts: Number of times to read the same finger (default 2)
    
    Returns:
        (success, message, template_data)
    """
    try:
        s = get_sensor()
        
        # First read
        print(f"Place finger for enrollment (1/{attempts})")
        if not read_fingerprint():
            return False, "Failed to read fingerprint (attempt 1)", None
        
        print("Remove finger...")
        time.sleep(2)
        
        # Second read
        print(f"Place same finger again (2/{attempts})")
        result = read_fingerprint()
        if not result:
            return False, "Failed to read fingerprint (attempt 2)", None
        
        # Convert second image to buffer 2
        s.convertImage(0x02)
        
        # Compare the two reads
        score = s.compareCharacteristics()
        if score < 50:  # Adjust threshold as needed
            return False, f"Fingerprints did not match (score: {score})", None
        
        # Create template
        s.createTemplate()
        
        # Store in sensor at given position
        if s.storeTemplate(position):
            # Download the template for storage in Firestore
            template_data = download_template(position)
            return True, f"Fingerprint enrolled successfully (score: {score})", template_data
        else:
            return False, "Failed to store template in sensor", None
            
    except Exception as e:
        print(f"Error enrolling fingerprint: {e}")
        return False, f"Error: {str(e)}", None

def download_template(position: int) -> Optional[str]:
    """Download a template from sensor memory and convert to string"""
    try:
        s = get_sensor()
        s.loadTemplate(position, 0x01)
        characteristics = s.downloadCharacteristics(0x01)
        
        # Convert to hex string for storage
        template_str = ''.join([f'{byte:02x}' for byte in characteristics])
        return template_str
        
    except Exception as e:
        print(f"Error downloading template: {e}")
        return None

def upload_template(template_str: str, position: int) -> bool:
    """Upload a template string to sensor memory"""
    try:
        s = get_sensor()
        
        # Convert hex string back to bytes
        characteristics = bytes.fromhex(template_str)
        
        # Upload to buffer 1
        s.uploadCharacteristics(0x01, characteristics)
        
        # Store in sensor memory
        return s.storeTemplate(position)
        
    except Exception as e:
        print(f"Error uploading template: {e}")
        return False

def verify_fingerprint_with_templates(templates: list) -> Tuple[bool, int, Optional[int]]:
    """
    Verify a fingerprint against multiple stored templates.
    
    Args:
        templates: List of template strings to check against
    
    Returns:
        (matched, confidence_score, matched_template_index)
    """
    try:
        s = get_sensor()
        
        # Read the finger to verify
        print("Place finger for verification...")
        if not read_fingerprint():
            return False, 0, None
        
        # The fingerprint is now in buffer 1
        # Compare against each stored template
        best_score = 0
        best_match_index = None
        
        for idx, template_data in enumerate(templates):
            # Upload template to buffer 2
            try:
                characteristics = bytes.fromhex(template_data['template_data'])
                s.uploadCharacteristics(0x02, characteristics)
                
                # Compare buffer 1 (current finger) with buffer 2 (stored template)
                score = s.compareCharacteristics()
                
                if score > best_score:
                    best_score = score
                    best_match_index = template_data['index']
                
            except Exception as e:
                print(f"Error comparing with template {idx}: {e}")
                continue
        
        # Threshold for accepting a match (adjust as needed)
        MATCH_THRESHOLD = 50
        
        if best_score >= MATCH_THRESHOLD:
            return True, best_score, best_match_index
        
        return False, best_score, None
        
    except Exception as e:
        print(f"Error verifying fingerprint: {e}")
        return False, 0, None

def search_fingerprint(page: int = 0) -> Tuple[bool, Optional[int], Optional[int]]:
    """
    Read a fingerprint and search for it in sensor's database.
    
    Returns:
        (found, position, accuracy_score)
    """
    try:
        s = get_sensor()
        
        # Read fingerprint
        if not read_fingerprint():
            return False, None, None
        
        # Search the sensor's database
        result = s.searchTemplate()
        position = result[0]
        accuracy = result[1]
        
        if position >= 0:
            return True, position, accuracy
        return False, None, None
        
    except Exception as e:
        print(f"Error searching fingerprint: {e}")
        return False, None, None

def delete_template_from_sensor(position: int) -> bool:
    """Delete a template from sensor memory"""
    try:
        s = get_sensor()
        return s.deleteTemplate(position)
    except Exception as e:
        print(f"Error deleting template: {e}")
        return False

def clear_sensor_database() -> bool:
    """Clear all templates from sensor (use with caution!)"""
    try:
        s = get_sensor()
        return s.clearDatabase()
    except Exception as e:
        print(f"Error clearing database: {e}")
        return False
