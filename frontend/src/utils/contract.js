import { ethers } from "ethers";

export const CONTRACT_ADDRESS = "0x89e21612Ee5F05311aaFb9fbd1e98041cC88c4bb";

const CONTRACT_ABI = [
	{
		inputs: [
			{
				internalType: "string",
				name: "",
				type: "string",
			},
		],
		name: "aadhaarRegistered",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "string",
				name: "aadhaarHash",
				type: "string",
			},
			{
				internalType: "uint256",
				name: "age",
				type: "uint256",
			},
		],
		name: "registerVoter",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "string",
				name: "name",
				type: "string",
			},
			{
				internalType: "string",
				name: "description",
				type: "string",
			},
		],
		name: "addCandidate",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "candidateId",
				type: "uint256",
			},
		],
		name: "vote",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [],
		name: "candidateCount",
		outputs: [
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "uint256",
				name: "id",
				type: "uint256",
			},
		],
		name: "getCandidate",
		outputs: [
			{
				internalType: "string",
				name: "",
				type: "string",
			},
			{
				internalType: "string",
				name: "",
				type: "string",
			},
			{
				internalType: "uint256",
				name: "",
				type: "uint256",
			},
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "string",
				name: "aadhaarHash",
				type: "string",
			},
		],
		name: "isRegistered",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{
				internalType: "string",
				name: "aadhaarHash",
				type: "string",
			},
		],
		name: "hasUserVoted",
		outputs: [
			{
				internalType: "bool",
				name: "",
				type: "bool",
			},
		],
		stateMutability: "view",
		type: "function",
	},
];

// Add network check function
async function checkAndSwitchNetwork() {
	if (!window.ethereum) throw new Error("MetaMask not installed");

	try {
		// Request to switch to Sepolia network
		await window.ethereum.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: "0xaa36a7" }], // Chain ID for Sepolia
		});
	} catch (switchError) {
		// Handle chain switch error
		if (switchError.code === 4902) {
			throw new Error("Please add Sepolia network to MetaMask");
		}
		throw new Error("Please switch to Sepolia network in MetaMask");
	}
}

// Update init function
async function init() {
	if (!window.ethereum) throw new Error("MetaMask not installed");

	try {
		await checkAndSwitchNetwork();
		const provider = new ethers.BrowserProvider(window.ethereum);
		await provider.send("eth_requestAccounts", []);
		const signer = await provider.getSigner();
		const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

		// Verify contract connection
		await contract.candidateCount();

		return { provider, signer, contract };
	} catch (err) {
		console.error("Contract initialization error:", err);
		if (err.code === "CALL_EXCEPTION") {
			throw new Error(
				"Contract not found on this network. Please verify contract address."
			);
		}
		throw err;
	}
}

export async function getSignerAddress() {
	const { signer } = await init();
	return await signer.getAddress();
}

// Add this helper function for Aadhaar hashing
async function sha256Hex(message) {
	const msgUint8 = new TextEncoder().encode(message);
	const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

export async function isVoterRegistered(aadhaar) {
	try {
		const { contract } = await init();
		const aadhaarHash = await sha256Hex(aadhaar);
		// Use the aadhaarRegistered(string) view on-chain (matches deployed contract)
		const exists = await contract.aadhaarRegistered(aadhaarHash);
		return Boolean(exists);
	} catch (err) {
		console.error("Error checking voter registration:", err);
		if (err.code === "CALL_EXCEPTION" || err.message.includes("missing revert data")) {
			throw new Error("Contract call failed. Verify contract address and network (Sepolia) in MetaMask.");
		}
		throw new Error("Failed to check voter registration: " + (err.message || err));
	}
}

export async function registerVoterOnChain(aadhaar, age) {
	const { contract } = await init();
	try {
		// Hash the Aadhaar before sending to blockchain
		const aadhaarHash = await sha256Hex(aadhaar);
		const tx = await contract.registerVoter(aadhaarHash, age);
		const receipt = await tx.wait();
		return receipt.transactionHash;
	} catch (err) {
		console.error("Registration error:", err);
		if (err.code === "CALL_EXCEPTION") {
			throw new Error(
				"Contract interaction failed. Please check your network connection and try again."
			);
		}
		throw err;
	}
}

export async function addCandidateOnChain(name, description) {
	const { contract } = await init();
	const tx = await contract.addCandidate(name, description);
	await tx.wait();
}

export async function voteOnChain(candidateId) {
	const { contract } = await init();
	try {
		const tx = await contract.vote(candidateId);
		const receipt = await tx.wait();
		return receipt.transactionHash;
	} catch (err) {
		if (err.message.includes("Already voted")) {
			throw new Error("You have already voted");
		}
		throw err;
	}
}

export async function getCandidateCount() {
	const { contract } = await init();
	const count = await contract.candidateCount();
	return Number(count);
}

export async function getCandidate(id) {
	const { contract } = await init();
	try {
		const [name, description, voteCount, isActive] = await contract.getCandidate(
			id
		);
		return {
			id,
			name,
			description,
			voteCount: voteCount.toString(),
			isActive,
		};
	} catch (err) {
		console.error(`Error fetching candidate ${id}:`, err);
		throw new Error("Failed to fetch candidate details");
	}
}

export async function hasUserVoted(aadhaar) {
	const { contract } = await init();
	try {
		const aadhaarHash = await sha256Hex(aadhaar);
		const isRegistered = await contract.isRegistered(aadhaarHash);
		if (!isRegistered) return false;
		return await contract.hasUserVoted(aadhaarHash);
	} catch (err) {
		console.error("Error checking voting status:", err);
		if (err.code === "CALL_EXCEPTION") {
			throw new Error("Failed to check voting status. Please try again.");
		}
		return false;
	}
}