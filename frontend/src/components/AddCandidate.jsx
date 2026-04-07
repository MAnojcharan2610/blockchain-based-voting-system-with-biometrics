import React, { useState } from "react";
import { toast } from "react-toastify";
import { addCandidateOnChain } from "../utils/contract";

export default function AddCandidate() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addCandidateOnChain(name, description);
      toast.success("Candidate added successfully!");
      setName("");
      setDescription("");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card form">
        <h2 className="form-title">Add Candidate</h2>
        
        <form onSubmit={handleSubmit} className="candidate-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter candidate name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter candidate description"
              rows="4"
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn primary-btn"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Candidate'}
          </button>
        </form>
      </div>
    </div>
  );
}