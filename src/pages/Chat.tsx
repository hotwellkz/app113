import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Image, Paperclip, Smile } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Message } from '../types/chat';
import { ChatHeader } from '../components/chat/ChatHeader';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      setMessages(messagesData);
      setLoading(false);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (text: string, attachments?: File[]) => {
    try {
      await addDoc(collection(db, 'messages'), {
        text,
        senderId: 'current-user-id',
        senderName: 'Текущий пользователь',
        timestamp: serverTimestamp(),
        attachments: [],
        isRead: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleNotificationsClick = () => {
    // Обработка уведомлений
  };

  const handleSettingsClick = () => {
    // Обработка настроек
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <ChatHeader
        unreadCount={unreadCount}
        onNotificationsClick={handleNotificationsClick}
        onSettingsClick={handleSettingsClick}
      />
      
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages}
          onScrollToBottom={scrollToBottom}
          messagesEndRef={messagesEndRef}
        />
      </div>
      
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};