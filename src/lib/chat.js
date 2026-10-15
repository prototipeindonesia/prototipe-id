import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// =========================================================
// BUAT ID CHAT UNIK dari 2 user
// =========================================================
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

// =========================================================
// BUAT / PASTIKAN CHAT DOC ADA (dipanggil saat pilih kontak)
// =========================================================
export async function ensureChatDoc(otherUserId) {
  const senderId = auth.currentUser?.uid;
  if (!senderId) throw new Error('Harus login.');

  const chatId = getChatId(senderId, otherUserId);

  await setDoc(
    doc(db, 'chats', chatId),
    {
      participants: [senderId, otherUserId],
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return chatId;
}

// =========================================================
// KIRIM PESAN
// =========================================================
export async function sendMessage(receiverId, text) {
  const senderId = auth.currentUser?.uid;
  if (!senderId) throw new Error('Harus login.');

  const chatId = getChatId(senderId, receiverId);

  // Update metadata chat
  await setDoc(
    doc(db, 'chats', chatId),
    {
      participants: [senderId, receiverId],
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Kirim pesan
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    receiverId,
    text,
    createdAt: serverTimestamp(),
    read: false,
  });
}

// =========================================================
// SUBSCRIBE PESAN (realtime)
// =========================================================
export function subscribeMessages(receiverId, callback) {
  const senderId = auth.currentUser?.uid;
  if (!senderId) return () => {};

  const chatId = getChatId(senderId, receiverId);
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    (err) => {
      console.error('subscribeMessages error:', err);
      callback([]);
    }
  );
}

// =========================================================
// SUBSCRIBE DAFTAR CHAT (UNTUK SIDEBAR)
// ✅ FIXED: pakai where array-contains + hanya filter lastMessageAt
// =========================================================
export function subscribeChatList(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  // ✅ Filter participants dulu, lalu sort di client (biar tidak butuh composite index)
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid)
  );

  return onSnapshot(
    q,
    async (snap) => {
      const chats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // Sort by lastMessageAt desc (client-side)
      chats.sort((a, b) => {
        const ta = a.lastMessageAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.lastMessageAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });

      // Ambil data lawan bicara
      const enriched = await Promise.all(
        chats.map(async (c) => {
          const otherId = c.participants.find((p) => p !== uid);
          try {
            const userSnap = await getDoc(doc(db, 'users', otherId));
            return {
              ...c,
              otherId,
              otherUser: userSnap.exists()
                ? userSnap.data()
                : { name: 'Unknown' },
            };
          } catch (_) {
            return {
              ...c,
              otherId,
              otherUser: { name: 'Unknown' },
            };
          }
        })
      );

      callback(enriched);
    },
    (err) => {
      console.error('subscribeChatList error:', err);
      callback([]);
    }
  );
}

// =========================================================
// CARI SUPER ADMIN
// =========================================================
export async function findSuperAdmin() {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', '==', 'admin_super')
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const adminDoc = snap.docs[0];
    return { id: adminDoc.id, ...adminDoc.data() };
  } catch (err) {
    console.error('findSuperAdmin error:', err);
    return null;
  }
}

// =========================================================
// CARI SEMUA ADMIN & SUPER ADMIN
// =========================================================
export async function findAdminOrSuperAdmin() {
  try {
    const q = query(
      collection(db, 'users'),
      where('role', 'in', ['admin', 'admin_super'])
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error('findAdminOrSuperAdmin error:', err);
    return [];
  }
}