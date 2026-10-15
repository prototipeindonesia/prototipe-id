'use client';
import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Fungsi helper buat chat ID
function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

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
    console.log('[ChatButton] Start chat:', { targetUserId, targetName });

    const senderId = auth.currentUser?.uid;
    if (!senderId) {
      toast.error('Harus login.');
      return;
    }

    if (!targetUserId) {
      toast.error('Target user tidak valid.');
      console.error('[ChatButton] targetUserId kosong');
      return;
    }

    if (senderId === targetUserId) {
      toast.error('Tidak bisa chat diri sendiri.');
      return;
    }

    setLoading(true);
    try {
      const chatId = getChatId(senderId, targetUserId);
      console.log('[ChatButton] Chat ID:', chatId);

      await setDoc(
        doc(db, 'chats', chatId),
        {
          participants: [senderId, targetUserId],
          lastMessage: 'Mulai percakapan',
          lastMessageAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log('[ChatButton] Chat doc created/updated');

      toast.success('Membuka chat...');
      if (onStart) onStart();
      router.push('/dashboard/chat');
    } catch (err) {
      console.error('[ChatButton] Error:', err);
      let msg = err.message;
      if (msg.includes('permission')) {
        msg = 'Tidak punya izin. Cek Firestore Rules.';
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startChat}
      disabled={loading}
      className={className}
    >
      <MessageCircle size={14} />
      {loading ? 'Membuka...' : label || `Chat ${targetName || ''}`}
    </button>
  );
}