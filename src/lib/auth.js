import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  getAuth,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { auth, db } from './firebase';

const googleProvider = new GoogleAuthProvider();

// === REGISTER (khusus FREELANCER saja) ===
export async function registerFreelancer(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    role: 'freelancer', // HARDCODE — tidak bisa diubah dari UI
    status: 'active',
    createdAt: serverTimestamp(),
  });
  return cred.user;
}

// === LOGIN ===
export async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  // Cek apakah user ada di Firestore & statusnya active
  const snap = await getDoc(doc(db, 'users', cred.user.uid));
  if (!snap.exists()) {
    await signOut(auth);
    throw new Error('Akun tidak terdaftar dalam sistem.');
  }
  const data = snap.data();
  if (data.status !== 'active') {
    await signOut(auth);
    throw new Error('Akun Anda tidak aktif. Hubungi admin.');
  }
  return cred.user;
}

// === LOGIN GOOGLE (khusus freelancer) ===
export async function loginWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
  if (!userDoc.exists()) {
    // Auto-register sebagai freelancer
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

// === LOGOUT ===
export async function logoutUser() {
  await signOut(auth);
}

// === CREATE ADMIN (dipanggil oleh Super Admin saja) ===
// Menggunakan secondary app agar tidak logout Super Admin
export async function createAdminBySuperAdmin(email, password, name, role = 'admin') {
  if (!['admin', 'admin_super'].includes(role)) {
    throw new Error('Role tidak valid.');
  }

  // Cek apakah current user benar-benar Super Admin
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Anda harus login.');

  const superSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!superSnap.exists() || superSnap.data().role !== 'admin_super') {
    throw new Error('Hanya Super Admin yang bisa menambah admin.');
  }

  // Buat secondary app agar tidak menimpa session Super Admin
  const secondaryApp = initializeApp(
    auth.app.options,
    `secondary-${Date.now()}`
  );
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      role,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);
    return cred.user;
  } catch (err) {
    await deleteApp(secondaryApp);
    throw err;
  }
}

// === NONAKTIFKAN / AKTIFKAN ADMIN ===
export async function toggleUserStatus(uid, newStatus) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Harus login.');
  const superSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!superSnap.exists() || superSnap.data().role !== 'admin_super') {
    throw new Error('Hanya Super Admin.');
  }
  await setDoc(doc(db, 'users', uid), { status: newStatus }, { merge: true });
}

// === HAPUS USER (hanya dari Firestore, bukan dari Auth) ===
export async function deleteUserDoc(uid) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Harus login.');
  const superSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!superSnap.exists() || superSnap.data().role !== 'admin_super') {
    throw new Error('Hanya Super Admin.');
  }
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'users', uid));
}