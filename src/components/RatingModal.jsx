'use client';
import { useState } from 'react';
import { Star } from 'lucide-react';
import { submitReview } from '@/lib/reviews';
import { logActivity } from '@/lib/audit';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function RatingModal({ order, onClose }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await submitReview({
        orderId: order.id,
        freelancerId: order.freelancerId,
        rating,
        comment,
      });

      await updateDoc(doc(db, 'orders', order.id), {
        rating,
        ratedAt: new Date().toISOString(),
      });

      await logActivity({
        action: 'SUBMIT_RATING',
        targetType: 'order',
        targetId: order.id,
        targetName: order.title,
        details: { rating, freelancerId: order.freelancerId },
      });

      toast.success('Terima kasih atas review Anda!');
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-md w-full">
        <h3 className="font-bold text-lg mb-2">Beri Rating</h3>
        <p className="text-sm text-gray-500 mb-4">{order.title}</p>

        <div className="flex gap-1 mb-4 justify-center">
          {[1, 2, 3, 4, 5].map((s) => (
            <button key={s} onClick={() => setRating(s)}>
              <Star
                size={36}
                className={
                  s <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }
              />
            </button>
          ))}
        </div>

        <textarea
          rows={3}
          placeholder="Tulis komentar (opsional)..."
          className="input mb-3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary flex-1 justify-center disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Review'}
          </button>
          <button onClick={onClose} className="btn btn-outline">
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}