import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const googleProvider = new GoogleAuthProvider();

export async function registerUser(email, password, name, role = 'freelancer') {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    role,
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name: cred.user.displayName,
      email: cred.user.email,
      role: 'freelancer',
      status: 'active',
      createdAt: serverTimestamp(),
    });
  }
  return cred.user;
}

export async function logoutUser() {
  await signOut(auth);
}
