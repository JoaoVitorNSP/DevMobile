// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAKpBX2qzm547G1kNbHdKQ0AXei-euRGcs",
  authDomain: "devmobile-ce3e9.firebaseapp.com",
  databaseURL: "https://devmobile-ce3e9-default-rtdb.firebaseio.com",
  projectId: "devmobile-ce3e9",
  storageBucket: "devmobile-ce3e9.appspot.com",
  messagingSenderId: "651182420399",
  appId: "1:651182420399:web:4427b6284ce6473f5abf5a",
  measurementId: "G-YF17EEWKHE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// getAnalytics normalmente não é necessário em React Native/Expo e pode
// falhar. Protegemos com try/catch para não quebrar o app em runtime.
let analytics;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // ambiente sem suporte a analytics (ex.: Expo) — ignorar
}

// Exportar auth para uso nas telas
export const auth = getAuth(app);
export const database = getDatabase(app);