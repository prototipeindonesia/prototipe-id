import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth } from './firebase';

export async function submitReview({
  orderId,
  freelancerId,
  rating,
  comment,
}) {
  const reviewerId = auth.currentUser?.uid;
  if (!reviewerId) throw new Error('Harus login.');

  await addDoc(collection(db, 'reviews'), {
    orderId,
    reviewerId,
    freelancerId,
    rating,
    comment: comment || '',
    createdAt: serverTimestamp(),
  });

  // Update rata-rata rating freelancer
  const q = query(
    collection(db, 'reviews'),
    where('freelancerId', '==', freelancerId)
  );
  const snap = await getDocs(q);
  const all = snap.docs.map((d) => d.data());
  const avg = all.reduce((sum, r) => sum + r.rating, 0) / all.length;

  await updateDoc(doc(db, 'users', freelancerId), {
    rating: Math.round(avg * 10) / 10,
    totalReviews: all.length,
  });
}

export async function getFreelancerReviews(freelancerId) {
  const q = query(
    collection(db, 'reviews'),
    where('freelancerId', '==', freelancerId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
