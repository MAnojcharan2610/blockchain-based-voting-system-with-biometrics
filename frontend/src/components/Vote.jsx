import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { getCandidateCount, getCandidate, voteOnChain } from "../utils/contract";
import { hasUserVotedFirebase, updateVoteStatus } from "../utils/firebase";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.4,
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3 }
  }
};

export default function Vote() {
  const [candidates, setCandidates] = useState([]);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      const voterData = JSON.parse(localStorage.getItem("voterData"));
      if (!voterData) {
        toast.error("Please login first");
        return;
      }

      const n = await getCandidateCount();
      const list = [];
      for (let i = 1; i <= n; i++) list.push(await getCandidate(i));
      setCandidates(list);

      const hasVoted = await hasUserVotedFirebase(voterData.aadhaarNumber);
      setVoted(hasVoted);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load candidates");
    }
  }

  async function handleVote() {
    if (!selectedId) {
      toast.warn("Please select a candidate");
      return;
    }

    setLoading(true);
    try {
      const voterData = JSON.parse(localStorage.getItem("voterData"));
      if (!voterData) throw new Error("Please login first");

      const txHash = await voteOnChain(selectedId);
      await updateVoteStatus(voterData.aadhaarNumber, txHash);
      
      toast.success("Vote submitted successfully!");
      setVoted(true);
      await load();
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Vote failed");
    } finally {
      setLoading(false);
    }
  }

  const CandidateSkeleton = () => (
    <div className="candidate-card animate-pulse">
      <div className="h-6 w-3/4 bg-gray-700 rounded mb-4"></div>
      <div className="h-4 w-full bg-gray-700 rounded mb-2"></div>
      <div className="h-4 w-2/3 bg-gray-700 rounded"></div>
    </div>
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container"
    >
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">
          <span className="gradient-text">Cast Your Vote</span>
        </h2>
        
        {voted ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center py-8"
          >
            <div className="badge success mb-4">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Vote Recorded
            </div>
            <p className="text-secondary">Thank you for participating in the election!</p>
          </motion.div>
        ) : (
          <>
            <div className="grid">
              {loading ? (
                // Show skeletons while loading
                [...Array(3)].map((_, i) => <CandidateSkeleton key={i} />)
              ) : (
                candidates.map((candidate) => (
                  <motion.div 
                    key={candidate.id}
                    variants={cardVariants}
                    whileHover={{ scale: 1.02 }}
                    className={`candidate-card ${selectedId === candidate.id ? 'selected' : ''}`}
                    onClick={() => setSelectedId(candidate.id)}
                  >
                    <h3>{candidate.name}</h3>
                    <p>{candidate.description}</p>
                    <div className="vote-count">
                      <span>{candidate.voteCount} votes</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            
            <div className="actions">
              <button 
                className="btn primary-btn"
                onClick={handleVote}
                disabled={loading || !selectedId}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  "Submit Vote"
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}