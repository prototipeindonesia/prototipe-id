import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from './firebase';

// =========================================================
// SIMPAN / UPDATE PROFIL FREELANCER
// =========================================================
export async function saveProfile({ bio, skills, avatar, tagline }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Harus login.');

  await updateDoc(doc(db, 'users', uid), {
    bio: bio || '',
    skills: skills || '',
    avatar: avatar || '',
    tagline: tagline || '',
    updatedAt: serverTimestamp(),
  });
}

// =========================================================
// TAMBAH PORTFOLIO ITEM
// =========================================================
export async function addPortfolioItem({ title, description, imageUrl, category }) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Harus login.');

  const docRef = await addDoc(collection(db, 'portfolio_items'), {
    userId: uid,
    title: title || 'Untitled',
    description: description || '',
    imageUrl,
    category: category || 'Lainnya',
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}

// =========================================================
// SUBSCRIBE PORTFOLIO USER (realtime)
// =========================================================
export function subscribePortfolio(userId, callback) {
  const q = query(
    collection(db, 'portfolio_items'),
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Sort client-side (biar tidak butuh composite index)
      items.sort((a, b) => {
        const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
        const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
        return tb - ta;
      });
      callback(items);
    },
    (err) => {
      console.error('subscribePortfolio error:', err);
      callback([]);
    }
  );
}

// =========================================================
// HAPUS PORTFOLIO ITEM
// =========================================================
export async function deletePortfolioItem(itemId) {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Harus login.');

  await deleteDoc(doc(db, 'portfolio_items', itemId));
}

// =========================================================
// AMBIL PORTFOLIO USER (one-time)
// =========================================================
export async function getPortfolio(userId) {
  const q = query(
    collection(db, 'portfolio_items'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  items.sort((a, b) => {
    const ta = a.createdAt?.toDate?.()?.getTime?.() || 0;
    const tb = b.createdAt?.toDate?.()?.getTime?.() || 0;
    return tb - ta;
  });
  return items;
}