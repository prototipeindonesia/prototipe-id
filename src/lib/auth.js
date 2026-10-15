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
import { sendAdminCredentials } from './email';
import { sendWhatsApp, waAdminCredentials } from './whatsapp';
import { logActivity } from './audit';

const googleProvider = new GoogleAuthProvider();

// =========================================================
// REGISTER (khusus FREELANCER saja)
// =========================================================
export async function registerFreelancer(email, password, name) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(cred.user, { displayName: name });

  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid,
    name,
    email,
    role: 'freelancer', // HARDCODE — tidak bisa diubah dari UI
    status: 'active',
    rating: 0,
    totalReviews: 0,
    createdAt: serverTimestamp(),
  });

  // 📋 Log registrasi
  await logActivity({
    action: 'REGISTER_FREELANCER',
    targetType: 'user',
    targetId: cred.user.uid,
    targetName: name,
    details: { email },
  });

  return cred.user;
}

// =========================================================
// LOGIN
// =========================================================
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

  // 📋 Log login
  await logActivity({
    action: 'LOGIN',
    targetType: 'session',
    targetId: cred.user.uid,
    targetName: data.name,
    details: { role: data.role },
  });

  return cred.user;
}

// =========================================================
// LOGIN GOOGLE (auto-register sebagai freelancer)
// =========================================================
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
      rating: 0,
      totalReviews: 0,
      createdAt: serverTimestamp(),
    });

    // 📋 Log registrasi via Google
    await logActivity({
      action: 'REGISTER_FREELANCER',
      targetType: 'user',
      targetId: cred.user.uid,
      targetName: cred.user.displayName,
      details: { email: cred.user.email, method: 'google' },
    });
  } else {
    const data = userDoc.data();
    if (data.status !== 'active') {
      await signOut(auth);
      throw new Error('Akun Anda tidak aktif. Hubungi admin.');
    }

    // 📋 Log login Google
    await logActivity({
      action: 'LOGIN',
      targetType: 'session',
      targetId: cred.user.uid,
      targetName: data.name,
      details: { role: data.role, method: 'google' },
    });
  }

  return cred.user;
}

// =========================================================
// LOGOUT
// =========================================================
export async function logoutUser() {
  const currentUser = auth.currentUser;

  if (currentUser) {
    // 📋 Log logout SEBELUM signOut
    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};

    await logActivity({
      action: 'LOGOUT',
      targetType: 'session',
      targetId: currentUser.uid,
      targetName: userData.name || currentUser.email,
      details: {},
    });
  }

  await signOut(auth);
}

// =========================================================
// CREATE ADMIN (hanya Super Admin)
// Mengirim Email + WA otomatis + catat audit log
// =========================================================
export async function createAdminBySuperAdmin(
  email,
  password,
  name,
  role = 'admin',
  phone = null
) {
  if (!['admin', 'admin_super'].includes(role)) {
    throw new Error('Role tidak valid.');
  }

  // Cek current user benar-benar Super Admin
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

  let newUid = null;

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    newUid = cred.user.uid;
    await updateProfile(cred.user, { displayName: name });

    // Simpan data di Firestore
    await setDoc(doc(db, 'users', cred.user.uid), {
      uid: cred.user.uid,
      name,
      email,
      phone: phone || null,
      role,
      status: 'active',
      createdBy: currentUser.uid,
      createdAt: serverTimestamp(),
    });

    // Sign out dari secondary & hapus app
    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    // ============================================
    // 📧 Kirim Email (dengan fallback)
    // ============================================
    let emailResult = { success: false, error: 'Skipped' };
    try {
      emailResult = await sendAdminCredentials({
        toEmail: email,
        toName: name,
        password,
        role,
      });
    } catch (err) {
      console.error('Email error:', err);
      emailResult = { success: false, error: err.message };
    }

    // ============================================
    // 📱 Kirim WhatsApp (dengan fallback)
    // ============================================
    let waResult = { error: 'No phone provided' };
    if (phone) {
      try {
        const loginUrl = typeof window !== 'undefined'
          ? `${window.location.origin}/login`
          : 'https://prototipe-id.vercel.app/login';

        waResult = await sendWhatsApp(
          phone,
          waAdminCredentials({
            name,
            email,
            password,
            loginUrl,
          })
        );
      } catch (err) {
        console.error('WA error:', err);
        waResult = { error: err.message };
      }
    }

    // ============================================
    // 📋 Catat Audit Log
    // ============================================
    await logActivity({
      action: 'CREATE_ADMIN',
      targetType: 'user',
      targetId: newUid,
      targetName: name,
      details: {
        email,
        role,
        phone: phone || '-',
        emailSent: emailResult.success,
        waSent: !waResult.error,
      },
    });

    // Return hasil lengkap
    return {
      user: cred.user,
      emailSent: emailResult.success,
      emailError: emailResult.error,
      waSent: !waResult.error,
      waError: waResult.error,
    };
  } catch (err) {
    // Cleanup kalau ada error
    try {
      await deleteApp(secondaryApp);
    } catch (_) {}
    throw err;
  }
}

// =========================================================
// NONAKTIFKAN / AKTIFKAN ADMIN
// =========================================================
export async function toggleUserStatus(uid, newStatus) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Harus login.');

  const superSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!superSnap.exists() || superSnap.data().role !== 'admin_super') {
    throw new Error('Hanya Super Admin.');
  }

  await setDoc(doc(db, 'users', uid), { status: newStatus }, { merge: true });

  // 📋 Log
  const targetSnap = await getDoc(doc(db, 'users', uid));
  const targetName = targetSnap.exists() ? targetSnap.data().name : uid;

  await logActivity({
    action: 'TOGGLE_ADMIN_STATUS',
    targetType: 'user',
    targetId: uid,
    targetName,
    details: { newStatus },
  });
}

// =========================================================
// HAPUS USER (hanya dari Firestore, bukan dari Auth)
// =========================================================
export async function deleteUserDoc(uid) {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Harus login.');

  const superSnap = await getDoc(doc(db, 'users', currentUser.uid));
  if (!superSnap.exists() || superSnap.data().role !== 'admin_super') {
    throw new Error('Hanya Super Admin.');
  }

  // Ambil data target dulu untuk log
  const targetSnap = await getDoc(doc(db, 'users', uid));
  const targetData = targetSnap.exists() ? targetSnap.data() : {};

  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'users', uid));

  // 📋 Log
  await logActivity({
    action: 'DELETE_ADMIN',
    targetType: 'user',
    targetId: uid,
    targetName: targetData.name || uid,
    details: {
      email: targetData.email,
      role: targetData.role,
    },
  });
}