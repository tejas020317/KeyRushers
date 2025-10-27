// src/firebase.js (Updated with proper provider configuration)
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FB_API_KEY || 'AIzaSyB8sENk5Hok3kNtSLnlZVHTgAgOm7y0zlM',
  authDomain: process.env.REACT_APP_FB_AUTH_DOMAIN || 'keyrushers.firebaseapp.com',
  projectId: process.env.REACT_APP_FB_PROJECT_ID || 'keyrushers',
  storageBucket: process.env.REACT_APP_FB_STORAGE_BUCKET || 'keyrushers.appspot.com',
  messagingSenderId: process.env.REACT_APP_FB_MESSAGING_SENDER_ID || '285630157049',
  appId: process.env.REACT_APP_FB_APP_ID || '1:285630157049:web:58be7656cac99e8b505228',
  measurementId: process.env.REACT_APP_FB_MEASUREMENT_ID || 'G-LEGPT9YWGX',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: 'select_account',
});

// GitHub Provider
export const githubProvider = new GithubAuthProvider();
githubProvider.setCustomParameters({
  allow_signup: 'true',
});

// Facebook Provider
export const facebookProvider = new FacebookAuthProvider();
facebookProvider.setCustomParameters({
  display: 'popup',
});

export default app;