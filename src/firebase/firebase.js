import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCKbHYSIvg6gN5GSXutZzVUeqMifBvrz3w",
  authDomain: "taoteching-2b6ea.firebaseapp.com",
  projectId: "taoteching-2b6ea",
  storageBucket: "taoteching-2b6ea.firebasestorage.app",
  messagingSenderId: "21593003234",
  appId: "1:21593003234:web:af87e99dd49c30aaa5fabb",
  measurementId: "G-9SP7LH9ZKF"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
