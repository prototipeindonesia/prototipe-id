import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from './firebase';

// Daftar action & label untuk UI
export const ACTION_LABELS = {
  REGISTER_FREELANCER: { label: 'Daftar freelancer baru', color: 'green' },
  CREATE_ADMIN: { label: 'Membuat admin baru', color: 'blue' },
  UPDATE_ADMIN: { label: 'Mengubah admin', color: 'yellow' },
  DELETE_ADMIN: { label: 'Menghapus admin', color: 'red' },
  TOGGLE_ADMIN_STATUS: { label: 'Mengubah status admin', color: 'yellow' },
  CREATE_ORDER: { label: 'Membuat order', color: 'green' },
  UPDATE_ORDER: { label: 'Mengubah order', color: 'yellow' },
  DELETE_ORDER: { label: 'Menghapus order', color: 'red' },
  APPROVE_ORDER: { label: 'Menyetujui order', color: 'green' },
  ASSIGN_FREELANCER: { label: 'Freelancer ambil order', color: 'blue' },
  SUBMIT_RATING: { label: 'Memberi rating', color: 'yellow' },
  UPDATE_WITHDRAWAL: { label: 'Update withdrawal', color: 'yellow' },
  LOGIN: { label: 'Login', color: 'gray' },
  LOGOUT: { label: 'Logout', color: 'gray' },
};

// Fungsi utama untuk log
export async function logActivity({
  action,
  targetType = null,
  targetId = null,
  targetName = null,
  details = {},
}) {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Ambil data user dari Firestore
    const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userSnap.exists() ? userSnap.data() : {};

    await addDoc(collection(db, 'audit_logs'), {
      action,
      actorId: currentUser.uid,
      actorName: userData.name || currentUser.displayName || 'Unknown',
      actorEmail: userData.email || currentUser.email,
      actorRole: userData.role || 'unknown',
      targetType,
      targetId,
      targetName,
      details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Failed to log activity:', err);
  }
}

// Hook untuk stream audit logs
export function subscribeAuditLogs(callback, maxItems = 100) {
  const q = query(
    collection(db, 'audit_logs'),
    orderBy('createdAt', 'desc'),
    limit(maxItems)
  );
  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(logs);
  });
}