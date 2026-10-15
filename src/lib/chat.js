import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// Buat ID chat unik dari 2 user (urut abjad agar konsisten)
export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

// Kirim pesan
export async function sendMessage(receiverId, text) {
  const senderId = auth.currentUser?.uid;
  if (!senderId) throw new Error('Harus login.');

  const chatId = getChatId(senderId, receiverId);

  // Buat/pastikan dokumen chat ada
  await setDoc(
    doc(db, 'chats', chatId),
    {
      participants: [senderId, receiverId],
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    },
    { merge: true }
  );

  // Tambah pesan
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    receiverId,
    text,
    createdAt: serverTimestamp(),
    read: false,
  });
}

// Subscribe pesan realtime
export function subscribeMessages(receiverId, callback) {
  const senderId = auth.currentUser?.uid;
  if (!senderId) return () => {};

  const chatId = getChatId(senderId, receiverId);
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

// Subscribe daftar chat user (untuk sidebar)
export function subscribeChatList(callback) {
  const uid = auth.currentUser?.uid;
  if (!uid) return () => {};

  const q = query(
    collection(db, 'chats'),
    orderBy('lastMessageAt', 'desc')
  );

  return onSnapshot(q, async (snap) => {
    const chats = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((c) => c.participants?.includes(uid));

    // Ambil data lawan bicara
    const enriched = await Promise.all(
      chats.map(async (c) => {
        const otherId = c.participants.find((p) => p !== uid);
        const userSnap = await getDoc(doc(db, 'users', otherId));
        return {
          ...c,
          otherId,
          otherUser: userSnap.exists() ? userSnap.data() : { name: 'Unknown' },
        };
      })
    );
    callback(enriched);
  });
}