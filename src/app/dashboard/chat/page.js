'use client';
import { useEffect, useState } from 'react';
import {
  subscribeChatList,
  subscribeMessages,
  sendMessage,
} from '@/lib/chat';
import { useAuth } from '@/context/AuthContext';
import { Send, MessageCircle } from 'lucide-react';

export default function ChatPage() {
  const { user } = useAuth();
  const [chatList, setChatList] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;
    await sendMessage(activeChat.otherId, text.trim());
    setText('');
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Daftar Chat */}
      <div className="w-80 bg-white rounded-xl border border-gray-100 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle size={18} /> Chat
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chatList.length === 0 && (
            <p className="text-sm text-gray-500 p-4">
              Belum ada percakapan.
            </p>
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
                <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {chat.otherUser?.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
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

      {/* Area Chat */}
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
                      <p className="text-sm">{m.text}</p>
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
              <button className="btn btn-primary">
                <Send size={16} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Pilih percakapan untuk mulai chat
          </div>
        )}
      </div>
    </div>
  );
}