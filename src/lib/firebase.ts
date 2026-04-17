import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const loginWithEmail = (email: string, password: string) => 
  signInWithEmailAndPassword(auth, email, password);

export const registerWithEmail = (email: string, password: string) => 
  createUserWithEmailAndPassword(auth, email, password);

export const resetPassword = (email: string) => 
  sendPasswordResetEmail(auth, email);

export const logout = () => signOut(auth);

// Phone Auth
let confirmationResult: ConfirmationResult | null = null;

export const setupRecaptcha = (containerId: string) => {
  if (!(window as any).recaptchaVerifier) {
    (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
      }
    });
  }
};

export const signInWithPhone = async (phoneNumber: string) => {
  const appVerifier = (window as any).recaptchaVerifier;
  confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  return confirmationResult;
};

export const verifyOtp = async (otp: string) => {
  if (!confirmationResult) throw new Error("No pending OTP request");
  return await confirmationResult.confirm(otp);
};
