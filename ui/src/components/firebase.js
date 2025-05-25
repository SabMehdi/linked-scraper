// src/components/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBPDZOxRXeGvVHwsOZFLPyDvXxQDQRl_Hs",
  authDomain: "linked-scraper.firebaseapp.com",
  databaseURL: "https://linked-scrapper-44d7e-default-rtdb.firebaseio.com/",
  projectId: "linked-scraper",
  storageBucket: "linked-scraper.appspot.com",
  messagingSenderId: "1098360466997",
  appId: "1:1098360466997:web:e7c2c5c2e2c2c2c2e2c2c2"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
