import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAztT4dNVqTPMecYx3AaN3fdg3NT3BLoYM",
  authDomain: "padelbase-bc71d.firebaseapp.com",
  databaseURL: "https://padelbase-bc71d-default-rtdb.firebaseio.com",
  projectId: "padelbase-bc71d",
  storageBucket: "padelbase-bc71d.firebasestorage.app",
  messagingSenderId: "438860500100",
  appId: "1:438860500100:web:5dd2a5d2e8f7be60d806d1",
  measurementId: "G-F0GP67S34D",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app)

// Initialize Firebase Authentication
export const auth = getAuth(app)

export default app
