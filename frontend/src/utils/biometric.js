const API_BASE_URL = import.meta.env.VITE_BIOMETRIC_API_URL || 'http://localhost:8000';

export const fingerprintAPI = {
  /**
   * Start fingerprint enrollment for a user
   */
  async startEnrollment(aadhaarNumber) {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/enroll/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to start enrollment');
    }

    return await response.json();
  },

  /**
   * Capture a single fingerprint during enrollment
   */
  async captureFingerprint(aadhaarNumber, fingerprintIndex) {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/enroll/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aadhaar_number: aadhaarNumber,
        fingerprint_index: fingerprintIndex,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to capture fingerprint');
    }

    return await response.json();
  },

  /**
   * Complete the enrollment process
   */
  async completeEnrollment(aadhaarNumber) {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/enroll/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to complete enrollment');
    }

    return await response.json();
  },

  /**
   * Verify fingerprint during login
   */
  async verifyFingerprint(aadhaarNumber) {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ aadhaar_number: aadhaarNumber }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to verify fingerprint');
    }

    return await response.json();
  },

  /**
   * Check enrollment status
   */
  async getEnrollmentStatus(aadhaarNumber) {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/status/${aadhaarNumber}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get enrollment status');
    }

    return await response.json();
  },
};
