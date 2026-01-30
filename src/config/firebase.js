// src/config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <-- ต้องมี storage

const firebaseConfig = {
  apiKey: "AIzaSyDqvZWSIiS2GrCI0fZ5fNEVEdkA-SFpl-4",
  authDomain: "recalpt-59d0f.firebaseapp.com",
  projectId: "recalpt-59d0f",
  storageBucket: "recalpt-59d0f.firebasestorage.app",
  messagingSenderId: "721060586583",
  appId: "1:721060586583:web:9c854dab45bcc3c2fbaf12",
  measurementId: "G-F6SEH4L88Z",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- เพิ่มบรรทัดนี้

export default app;
