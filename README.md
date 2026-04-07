# E-Voting Biometric Backend

FastAPI backend for fingerprint-based voter authentication using R304 fingerprint sensor.

## Features

- Fingerprint enrollment (10 fingers per user)
- Fingerprint verification for authentication
- Integration with R304 fingerprint sensor
- Firebase Firestore for storing fingerprint templates
- RESTful API endpoints

## Hardware Requirements

- Raspberry Pi (any model with USB port)
- R304 Optical Fingerprint Sensor
- USB-to-TTL adapter (if needed)

## Prerequisites

```bash
# Install system dependencies (on Raspberry Pi)
sudo apt-get update
sudo apt-get install python3-pip python3-dev
```

## Installation

1. Clone the repository and navigate to backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Linux/Mac
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Download Firebase service account key:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save as `serviceAccountKey.json` in the backend directory

5. Create `.env` file:
```bash
cp .env.example .env
```

6. Configure `.env` with your settings:
   - Update `FIREBASE_CREDENTIALS_PATH` and `FIREBASE_DATABASE_URL`
   - Update `SENSOR_PORT` (check with `ls /dev/tty*`)
   - Adjust sensor parameters if needed

## R304 Sensor Connection

### Wiring (using USB-to-TTL adapter):
- Red → 5V
- Black → GND
- Yellow → TX (to adapter RX)
- White → RX (to adapter TX)

### Find the sensor port:
```bash
ls /dev/ttyUSB*
# or
ls /dev/ttyAMA*
```

Update `SENSOR_PORT` in `.env` accordingly.

## Running the Server

### Development mode:
```bash
python main.py
```

### Production mode:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Enrollment

1. **Start Enrollment**
   - `POST /api/fingerprint/enroll/start`
   - Initialize enrollment for a user

2. **Capture Fingerprint**
   - `POST /api/fingerprint/enroll/capture`
   - Capture each of the 10 fingerprints (call 10 times)

3. **Complete Enrollment**
   - `POST /api/fingerprint/enroll/complete`
   - Finalize the enrollment process

### Verification

4. **Verify Fingerprint**
   - `POST /api/fingerprint/verify`
   - Verify a fingerprint during login

### Status

5. **Check Status**
   - `GET /api/fingerprint/status/{aadhaar_number}`
   - Check enrollment progress

## Usage Flow

### Registration (Frontend → Backend):

```
1. User clicks "Register"
2. Frontend calls /api/fingerprint/enroll/start
3. Loop 10 times:
   a. Prompt user to place finger
   b. Call /api/fingerprint/enroll/capture with fingerprint_index (0-9)
   c. Wait for success response
   d. Prompt to remove finger and place next finger
4. Call /api/fingerprint/enroll/complete
5. Complete registration in Firebase Realtime Database
```

### Login (Frontend → Backend):

```
1. User enters Aadhaar number
2. Frontend calls /api/fingerprint/verify with aadhaar_number
3. Backend prompts for fingerprint on sensor
4. If matched, return success with confidence score
5. Frontend proceeds with login
```

## Troubleshooting

### Sensor not detected:
```bash
# Check permissions
sudo chmod 666 /dev/ttyUSB0

# Or add user to dialout group
sudo usermod -a -G dialout $USER
# Then logout and login again
```

### Import errors:
```bash
# Make sure you're in the virtual environment
source venv/bin/activate

# Reinstall packages
pip install -r requirements.txt --force-reinstall
```

### Firestore permissions:
- Ensure your service account has Firestore read/write permissions
- Check Firebase Console → Firestore → Rules

## Security Notes

- Store `serviceAccountKey.json` securely (never commit to git)
- Use HTTPS in production
- Implement rate limiting for API endpoints
- Consider encrypting fingerprint templates at rest
- Validate all inputs on both client and server side

## License

MIT
