'use client';
import { MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getChatId } from '@/lib/chat';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function ChatButton({ targetUserId, targetName }) {
  const router = useRouter();

  const startChat = async () => {
    const senderId = auth.currentUser?.uid;
    if (!senderId) return;

    const chatId = getChatId(senderId, targetUserId);

    // Buat chat doc kalau belum ada
    await setDoc(
      doc(db, 'chats', chatId),
      {
        participants: [senderId, targetUserId],
        lastMessage: 'Mulai percakapan',
        lastMessageAt: serverTimestamp(),
      },
      { merge: true }
    );

    router.push('/dashboard/chat');
  };

  return (
    <button onClick={startChat} className="btn btn-outline text-xs">
      <MessageCircle size={14} /> Chat {targetName}
    </button>
  );
}