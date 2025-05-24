import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"
import { getAuth } from "firebase/auth"

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAnNjPe0wtgWS4JpyK9fi3cMU1NVx0Uz2o",
  authDomain: "selvapadel.firebaseapp.com",
  projectId: "selvapadel",
  storageBucket: "selvapadel.firebasestorage.app",
  messagingSenderId: "533930458520",
  appId: "1:533930458520:web:b9a2b24c556071f8cbffed",
  measurementId: "G-YVY7HW4RKY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Realtime Database and get a reference to the service
export const database = getDatabase(app)

// Initialize Firebase Authentication
export const auth = getAuth(app)

export default app
