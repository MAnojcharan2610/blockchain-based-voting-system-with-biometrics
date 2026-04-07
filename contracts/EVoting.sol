// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract EVoting {
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        string aadhaarHash;
        uint256 age;
        uint256 votedCandidateId;
    }

    struct Candidate {
        string name;
        string description;
        uint256 voteCount;
        bool isActive;
    }

    address public admin;
    mapping(address => Voter) public voters;
    mapping(string => bool) public aadhaarRegistered;
    mapping(uint256 => Candidate) public candidates;
    uint256 public candidateCount;
    uint256 public voterCount;

    event VoterRegistered(address indexed voter, string aadhaarHash);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    // New state for published snapshot
    bool public resultsPublished;
    mapping(uint256 => uint256) public finalVoteCount;

    // Event emitted when admin publishes results
    event ResultsPublished(uint256 timestamp, uint256[] candidateIds, uint256[] voteCounts);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    function registerVoter(string calldata aadhaarHash, uint256 age) external {
        // Remove the wallet registration check for prototype
        // require(!voters[msg.sender].isRegistered, "Voter already registered");
        require(!aadhaarRegistered[aadhaarHash], "Aadhaar already registered");
        require(age >= 18, "Must be 18 or older");

        voters[msg.sender] = Voter({
            isRegistered: true,
            hasVoted: false,
            aadhaarHash: aadhaarHash,
            age: age,
            votedCandidateId: 0
        });

        aadhaarRegistered[aadhaarHash] = true;
        voterCount++;

        emit VoterRegistered(msg.sender, aadhaarHash);
    }

    function addCandidate(string calldata name, string calldata description) 
        external 
    {
        require(bytes(name).length > 0, "Name cannot be empty");
        candidateCount++;
        candidates[candidateCount] = Candidate({
            name: name,
            description: description,
            voteCount: 0,
            isActive: true
        });

        emit CandidateAdded(candidateCount, name);
    }

    function vote(uint256 candidateId) external {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        require(!voters[msg.sender].hasVoted, "Already voted");
        require(candidateId > 0 && candidateId <= candidateCount, "Invalid candidate");
        require(candidates[candidateId].isActive, "Candidate not active");

        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedCandidateId = candidateId;
        candidates[candidateId].voteCount++;

        emit VoteCast(msg.sender, candidateId);
    }

    // View functions
    function isRegistered(address account) external view returns (bool) {
        return voters[account].isRegistered;
    }

    function hasUserVoted(address account) external view returns (bool) {
        return voters[account].hasVoted;
    }

    function getCandidate(uint256 id) external view returns (
        string memory name,
        string memory description,
        uint256 voteCount,
        bool isActive
    ) {
        Candidate memory c = candidates[id];
        return (c.name, c.description, c.voteCount, c.isActive);
    }

    // Return a batch of all candidates and their counts (view)
    function getAllCandidates() public view returns (
        uint256[] memory ids,
        string[] memory names,
        string[] memory descriptions,
        uint256[] memory voteCounts,
        bool[] memory isActive
    ) {
        uint256 n = candidateCount;
        ids = new uint256[](n);
        names = new string[](n);
        descriptions = new string[](n);
        voteCounts = new uint256[](n);
        isActive = new bool[](n);
        for (uint256 i = 0; i < n; i++) {
            uint256 id = i + 1;
            Candidate storage c = candidates[id];
            ids[i] = id;
            names[i] = c.name;
            descriptions[i] = c.description;
            voteCounts[i] = c.voteCount;
            isActive[i] = c.isActive;
        }
        return (ids, names, descriptions, voteCounts, isActive);
    }

    // Admin publishes a final results snapshot (idempotent guard)
    function publishResults() external onlyAdmin {
        require(!resultsPublished, "Results already published");
        uint256 n = candidateCount;
        uint256[] memory ids = new uint256[](n);
        uint256[] memory counts = new uint256[](n);

        for (uint256 i = 0; i < n; i++) {
            uint256 id = i + 1;
            ids[i] = id;
            counts[i] = candidates[id].voteCount;
            finalVoteCount[id] = counts[i];
        }

        resultsPublished = true;
        emit ResultsPublished(block.timestamp, ids, counts);
    }

    function getFinalResult(uint256 id) external view returns (uint256) {
        require(resultsPublished, "Results not published");
        return finalVoteCount[id];
    }

    // Convenience: compute current leading candidate (view only)
    function result() external view returns (uint256 winnerId, uint256 winnerCount) {
        uint256 n = candidateCount;
        uint256 bestId = 0;
        uint256 bestCount = 0;
        for (uint256 i = 1; i <= n; i++) {
            uint256 c = candidates[i].voteCount;
            if (c > bestCount) {
                bestCount = c;
                bestId = i;
            }
        }
        return (bestId, bestCount);
    }
}