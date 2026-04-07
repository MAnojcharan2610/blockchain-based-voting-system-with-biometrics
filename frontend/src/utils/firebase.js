import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider 
} from "firebase/auth";
import { getDatabase, ref, set, get, query, orderByChild, equalTo, update } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

export async function checkAadhaarExists(aadhaarHash) {
  const usersRef = ref(db, 'users');
  const aadhaarQuery = query(usersRef, orderByChild('aadhaarHash'), equalTo(aadhaarHash));
  const snapshot = await get(aadhaarQuery);
  return snapshot.exists();
}

export async function registerFirebase(name, aadhaarNumber, age) {
  const usersRef = ref(db, 'users');
  const aadhaarQuery = query(usersRef, orderByChild('aadhaarNumber'), equalTo(aadhaarNumber));
  const snapshot = await get(aadhaarQuery);
  
  if (snapshot.exists()) {
    throw new Error("This Aadhaar number is already registered");
  }

  // Generate a unique ID for the user
  const userRef = ref(db, `users/${aadhaarNumber}`);
  await set(userRef, {
    name,
    aadhaarNumber,
    age,
    hasVoted: false,
    createdAt: Date.now(),
  });
}

export async function verifyVoter(aadhaarNumber) {
  const userRef = ref(db, `users/${aadhaarNumber}`);
  const snapshot = await get(userRef);
  
  if (!snapshot.exists()) {
    throw new Error("Voter not found. Please register first.");
  }

  const userData = snapshot.val();
  if (userData.hasVoted) {
    throw new Error("You have already voted");
  }
  
  return userData;
}

export async function loginFirebase(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);
  return userCred.user;
}

export async function getUserData(uid) {
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateVoteStatus(aadhaarNumber, txHash) {
  const userRef = ref(db, `users/${aadhaarNumber}`);
  const updates = {
    hasVoted: true,
    votedAt: Date.now(),
  };
  if (typeof txHash !== "undefined" && txHash !== null) {
    updates.voteTxHash = txHash;
  }
  await update(userRef, updates);
}

export async function hasUserVotedFirebase(aadhaarNumber) {
  const userRef = ref(db, `users/${aadhaarNumber}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val().hasVoted : false;
}

export async function logoutFirebase() {
  return await signOut(auth);
}