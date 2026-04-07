import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { toast } from 'react-toastify';

export default function VoterList() {
  const [voters, setVoters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoters();
  }, []);

  const loadVoters = async () => {
    try {
      const db = getDatabase();
      const votersRef = ref(db, 'users');
      const snapshot = await get(votersRef);

      if (snapshot.exists()) {
        const votersList = Object.entries(snapshot.val()).map(([id, data]) => ({
          id,
          ...data,
          // Mask Aadhaar number for privacy
          aadhaarMasked: `XXXX-XXXX-${data.aadhaarNumber.slice(-4)}`,
        }));
        setVoters(votersList);
      }
    } catch (error) {
      console.error('Error loading voters:', error);
      toast.error('Failed to load voter list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="form-title">Registered Voters</h2>
        
        {loading ? (
          <div className="loading">Loading voters...</div>
        ) : (
          <div className="voter-list">
            <div className="voter-table">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Aadhaar</th>
                    <th>Age</th>
                    <th>Status</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.map((voter) => (
                    <tr key={voter.id}>
                      <td>{voter.name}</td>
                      <td>{voter.aadhaarMasked}</td>
                      <td>{voter.age}</td>
                      <td>
                        <span className={`status ${voter.hasVoted ? 'voted' : 'pending'}`}>
                          {voter.hasVoted ? 'Voted' : 'Not Voted'}
                        </span>
                      </td>
                      <td>{new Date(voter.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}