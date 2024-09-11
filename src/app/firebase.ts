import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore,  } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJFgI0HxmUqQfvdGSzHL4g6RwtTEKf0_Y",
  authDomain: "bisourivage.firebaseapp.com",
  projectId: "bisourivage",
  storageBucket: "bisourivage.appspot.com",
  messagingSenderId: "1060895700324",
  appId: "1:1060895700324:web:2de7565cede429314fb671",
  measurementId: "G-S29V577DYX"
};

// Initialisation de Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };