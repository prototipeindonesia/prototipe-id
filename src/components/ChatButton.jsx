'use client';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getChatId } from '@/lib/chat';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ChatButton({
  targetUserId,
  targetName,
  label,
  className = 'btn btn-outline text-xs',
  onStart,
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const startChat = async () => {
    const senderId = auth.currentUser?.uid;
    if (!senderId) {
      toast.error('Harus login.');
      return;
    }

    if (senderId === targetUserId) {
      toast.error('Tidak bisa chat diri sendiri.');
      return;
    }

    setLoading(true);
    try {
      const chatId = getChatId(senderId, targetUserId);

      // Buat/pastikan dokumen chat ada
      await setDoc(
        doc(db, 'chats', chatId),
        {
          participants: [senderId, targetUserId],
          lastMessage: 'Mulai percakapan',
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );

      toast.success('Membuka chat...');
      if (onStart) onStart();
      router.push('/dashboard/chat');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={startChat} disabled={loading} className={className}>
      <MessageCircle size={14} />
      {loading ? 'Membuka...' : label || `Chat ${targetName || ''}`}
    </button>
  );
}