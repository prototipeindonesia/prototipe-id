'use client';
import { useEffect, useState } from 'react';
import {
  subscribeChatList,
  subscribeMessages,
  sendMessage,
  findAdminOrSuperAdmin,
} from '@/lib/chat';
import { useAuth } from '@/context/AuthContext';
import { Send, MessageCircle, Plus, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user, role } = useAuth();
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [sending, setSending] = useState(false);

  // Load daftar chat
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeChatList(setChatList);
    return () => unsub();
  }, [user]);

  // Load pesan ketika chat aktif berubah
  useEffect(() => {
    if (!activeChat) return;
    const unsub = subscribeMessages(activeChat.otherId, setMessages);
    return () => unsub();
  }, [activeChat]);

  // Buka modal "Chat Baru" & load kontak
  const openNewChat = async () => {
    console.log('[ChatPage] Open new chat modal');
    setShowNewChat(true);
    setLoadingContacts(true);
    try {
      const admins = await findAdminOrSuperAdmin();
      console.log('[ChatPage] Admins loaded:', admins.length);
      const list = admins.filter((u) => u.id !== user?.uid);
      setContacts(list);
    } catch (err) {
      console.error('[ChatPage] Load contacts error:', err);
      toast.error('Gagal load kontak.');
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  // Pilih kontak & buat chat
  const selectContact = async (contact) => {
    console.log('[ChatPage] Select contact:', contact);

    try {
      // Buat/pastikan chat doc lewat sendMessage (kirim pesan kosong trigger)
      // Sebenarnya kita panggil subscribeMessages ke contact id
      setActiveChat({
        id: [user.uid, contact.id].sort().join('_'),
        otherId: contact.id,
        otherUser: { name: contact.name, email: contact.email },
      });
      setShowNewChat(false);
      toast.success(`Chat dengan ${contact.name} dibuka`);
    } catch (err) {
      console.error('Select contact error:', err);
      toast.error(err.message);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChat || sending) return;

    setSending(true);
    try {
      await sendMessage(activeChat.otherId, text.trim());
      setText('');
    } catch (err) {
      console.error('Send error:', err);
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* ============================================ */}
      {/* DAFTAR CHAT */}
      {/* ============================================ */}
      <div className="w-80 bg-white rounded-xl border border-gray-100 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle size={18} /> Chat
          </h2>
          <button
            type="button"
            onClick={openNewChat}
            className="btn btn-primary text-xs"
          >
            <Plus size={14} /> Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatList.length === 0 && (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500 mb-3">
                Belum ada percakapan.
              </p>
              <button
                type="button"
                onClick={openNewChat}
                className="btn btn-primary text-xs mx-auto"
              >
                <Plus size={14} /> Mulai Chat Baru
              </button>
            </div>
          )}

          {chatList.map((chat) => (
            <button
              type="button"
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`w-full text-left p-3 border-b hover:bg-gray-50 ${
                activeChat?.id === chat.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {chat.otherUser?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">
                    {chat.otherUser?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {chat.lastMessage || 'Belum ada pesan'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* AREA CHAT */}
      {/* ============================================ */}
      <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col">
        {activeChat ? (
          <>
            <div className="p-4 border-b">
              <h3 className="font-bold">{activeChat.otherUser?.name}</h3>
              <p className="text-xs text-gray-500">
                {activeChat.otherUser?.email}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <MessageCircle
                    size={40}
                    className="mx-auto text-gray-300 mb-2"
                  />
                  <p className="text-sm text-gray-500">
                    Belum ada pesan.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Kirim pesan pertama Anda di bawah.
                  </p>
                </div>
              )}
              {messages.map((m) => {
                const isMe = m.senderId === user?.uid;
                return (
                  <div
                    key={m.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] px-3 py-2 rounded-lg ${
                        isMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSend} className="p-3 border-t flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tulis pesan..."
                className="input flex-1"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageCircle size={48} className="text-gray-300" />
            <p>Pilih percakapan atau mulai chat baru</p>
            <button
              type="button"
              onClick={openNewChat}
              className="btn btn-primary text-sm"
            >
              <Plus size={14} /> Mulai Chat Baru
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* MODAL CHAT BARU */}
      {/* ============================================ */}
      {showNewChat && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewChat(false)}
        >
          <div
            className="card max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">Mulai Chat Baru</h3>
              <button
                type="button"
                onClick={() => setShowNewChat(false)}
                className="text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            {loadingContacts && (
              <p className="text-gray-500 text-sm text-center py-8">
                Memuat kontak...
              </p>
            )}

            {!loadingContacts && contacts.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle
                  size={40}
                  className="mx-auto text-gray-300 mb-3"
                />
                <p className="text-gray-600 text-sm font-medium mb-1">
                  Tidak ada kontak tersedia
                </p>
                <p className="text-xs text-gray-400">
                  {role === 'freelancer'
                    ? 'Hubungi Super Admin untuk membuat akun admin.'
                    : 'Belum ada admin lain terdaftar.'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50"
                >
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    {c.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {c.role === 'admin_super' ? 'Super Admin' : 'Admin'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => selectContact(c)}
                    className="btn btn-primary text-xs"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}