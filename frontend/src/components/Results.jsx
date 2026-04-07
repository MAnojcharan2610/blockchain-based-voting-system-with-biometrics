import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { getCandidateCount, getCandidate } from '../utils/contract';
import { toast } from 'react-toastify';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Results() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    try {
      const count = await getCandidateCount();
      const candidateList = [];
      for (let i = 1; i <= count; i++) {
        const candidate = await getCandidate(i);
        candidateList.push(candidate);
      }
      setCandidates(candidateList);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  }

  const chartData = {
    labels: candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        data: candidates.map(c => Number(c.voteCount)),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue
          'rgba(99, 102, 241, 0.8)', // indigo
          'rgba(139, 92, 246, 0.8)', // violet
          'rgba(236, 72, 153, 0.8)', // pink
          'rgba(248, 113, 113, 0.8)', // red
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(248, 113, 113, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#f1f5f9' // gray-100
        }
      },
      title: {
        display: true,
        text: 'Election Results',
        color: '#f1f5f9',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94a3b8' // gray-400
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)' // gray-400 with opacity
        }
      },
      x: {
        ticks: {
          color: '#94a3b8' // gray-400
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.1)' // gray-400 with opacity
        }
      }
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="form-title gradient-text">Election Results</h2>
        
        {loading ? (
          <div className="loading">Loading results...</div>
        ) : (
          <div className="charts-container">
            <div className="chart-wrapper">
              <Bar data={chartData} options={chartOptions} />
            </div>
            
            <div className="chart-wrapper">
              <Doughnut 
                data={chartData} 
                options={{
                  ...chartOptions,
                  scales: {} // Remove scales for doughnut
                }} 
              />
            </div>

            <div className="results-grid">
              {candidates.map((candidate, index) => (
                <div key={index} className="result-card">
                  <h3>{candidate.name}</h3>
                  <p className="votes">{candidate.voteCount} votes</p>
                  <div className="percentage">
                    {((Number(candidate.voteCount) / 
                      candidates.reduce((acc, curr) => acc + Number(curr.voteCount), 0)) * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}