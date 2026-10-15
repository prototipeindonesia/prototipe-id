'use client';
import { useEffect, useState } from 'react';
import {
  subscribeChatList,
  subscribeMessages,
  sendMessage,
  findAdminOrSuperAdmin,
} from '@/lib/chat';
import { useAuth } from '@/context/AuthContext';
import { Send, MessageCircle, Plus, X } from 'lucide-react';
import ChatButton from '@/components/ChatButton';

export default function ChatPage() {
  const { user, role } = useAuth();
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Load daftar chat
  useEffect(() => {
    const unsub = subscribeChatList(setChatList);
    return () => unsub();
  }, []);

  // Load pesan ketika chat aktif berubah
  useEffect(() => {
    if (!activeChat) return;
    const unsub = subscribeMessages(activeChat.otherId, setMessages);
    return () => unsub();
  }, [activeChat]);

  // Load kontak untuk "Chat Baru"
  const openNewChat = async () => {
    setShowNewChat(true);
    setLoadingContacts(true);
    try {
      const admins = await findAdminOrSuperAdmin();
      // Filter: buang diri sendiri
      const list = admins.filter((u) => u.id !== user?.uid);
      setContacts(list);
    } catch (_) {
      setContacts([]);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;
    await sendMessage(activeChat.otherId, text.trim());
    setText('');
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
            onClick={openNewChat}
            className="btn btn-primary text-xs"
            title="Chat Baru"
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
                onClick={openNewChat}
                className="btn btn-primary text-xs mx-auto"
              >
                <Plus size={14} /> Mulai Chat Baru
              </button>
            </div>
          )}

          {chatList.map((chat) => (
            <button
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
                    {chat.lastMessage}
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
                <p className="text-center text-sm text-gray-400 py-8">
                  Belum ada pesan. Mulai percakapan!
                </p>
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
              />
              <button type="submit" className="btn btn-primary">
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <MessageCircle size={48} className="text-gray-300" />
            <p>Pilih percakapan atau mulai chat baru</p>
            <button onClick={openNewChat} className="btn btn-primary text-sm">
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
                <p className="text-gray-500 text-sm">
                  Tidak ada kontak tersedia.
                </p>
                {role === 'freelancer' && (
                  <p className="text-xs text-gray-400 mt-2">
                    Hubungi Super Admin untuk membuat akun admin.
                  </p>
                )}
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
                  <ChatButton
                    targetUserId={c.id}
                    targetName={c.name}
                    label="Chat"
                    className="btn btn-primary text-xs"
                    onStart={() => setShowNewChat(false)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}