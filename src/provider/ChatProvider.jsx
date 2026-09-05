import React, { useState, useEffect, useRef } from 'react';
import ChatContext from '../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from '../data/api';
import { get_admin_message } from '../config/enpoints';
import { Vibration, DeviceEventEmitter } from 'react-native';


export default function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [chatError, setChatError] = useState(null);

  const lastMessageCountRef = useRef(0);
  const lastMessagesJsonRef = useRef("");

  // Get UserId
  useEffect(() => {
    const fetchUser = async () => {
      try {
        let rawUser = await AsyncStorage.getItem("user");
        let u = null;
        try { u = rawUser ? JSON.parse(rawUser) : null; } catch(e) {}
        
        if (!u || !u.id) {
          rawUser = await AsyncStorage.getItem("userInfo");
          try { u = rawUser ? JSON.parse(rawUser) : null; } catch(e) {}
        }
        
        if (!u || !u.id) {
          rawUser = await AsyncStorage.getItem("customer");
          try { u = rawUser ? JSON.parse(rawUser) : null; } catch(e) {}
        }

        // Jika masih belum ada di memori lokal, tapi user sudah login (ada token), ambil dari API
        if (!u || !u.id) {
          const token = await AsyncStorage.getItem("authToken");
          if (token) {
            try {
              const apiUser = await get("/api/v1/customer/info");
              if (apiUser && apiUser.id) {
                u = apiUser;
                AsyncStorage.setItem("user", JSON.stringify(apiUser)).catch(() => {});
              }
            } catch (e) {
              console.log("Error fetching user info for chat fallback", e);
            }
          }
        }

        if (u && u.id) {
          setUserId(u.id);
        }
      } catch (e) {
        console.error("Error reading user ID for chat", e);
      }
    };
    
    fetchUser();

    const authListener = DeviceEventEmitter.addListener('authStateChanged', (isLoggedIn) => {
      if (isLoggedIn) {
        fetchUser();
      } else {
        setUserId(null);
        setMessages([]);
        setGlobalUnreadCount(0);
      }
    });

    return () => {
      authListener.remove();
    };
  }, []);

  const playSound = async () => {
    try {
      // Trigger physical vibration (expo-av removed - deprecated in SDK 54)
      Vibration.vibrate(400);
    } catch (error) {
      console.log("Error playing notification vibration:", error);
    }
  };

  const fetchMessages = async (isInitial = false) => {
    if (!userId) return;

    try {
      const ts = new Date().getTime();
      const response = await get(`${get_admin_message}?user_id=${userId}&_t=${ts}`);
      const messagesArray = Array.isArray(response) ? response : (response && Array.isArray(response.messages) ? response.messages : null);

      if (messagesArray) {
        // Only compare core fields safely
        const validMessages = messagesArray.filter(m => m != null);
        const simplifiedMsg = validMessages.map(m => ({ 
           id: m.id, 
           msg: m.message, 
           reply: m.reply,
           is_reply: m.is_reply
        }));
        const newJson = JSON.stringify(simplifiedMsg);
        
        if (isInitial || newJson !== lastMessagesJsonRef.current) {
          const newLen = validMessages.length;
          
          if (!isInitial && lastMessagesJsonRef.current) {
            try {
              const prevMessages = JSON.parse(lastMessagesJsonRef.current);
              
              const isAdminMsg = (m) => {
                if (!m) return false;
                const isRunner = 
                  m.target === 'runner' || 
                  m.target === 'deliveryman' || 
                  m.chat_type === 'runner' || 
                  m.chat_type === 'deliveryman' || 
                  m.deliveryman_id != null || 
                  m.sender_type === 'runner' || 
                  m.sender_type === 'deliveryman' || 
                  m.receiver_type === 'runner' || 
                  m.receiver_type === 'deliveryman';
                if (isRunner) return false;
                return m.is_reply == 1 || m.is_reply === true || (m.reply && String(m.reply).trim().length > 0);
              };
              const prevAdminCount = prevMessages.filter(isAdminMsg).length;
              const newAdminCount = messagesArray.filter(isAdminMsg).length;
              
              if (newAdminCount > prevAdminCount) {
                playSound();
                setGlobalUnreadCount(prev => prev + (newAdminCount - prevAdminCount));
              }
            } catch (e) {
              console.error("Error parsing prev messages for sound", e);
            }
          }
          
          lastMessageCountRef.current = newLen;
          lastMessagesJsonRef.current = newJson;
          setMessages(validMessages);
        }
      }
    } catch (err) {
      console.error("Failed to load CS messages globally:", err);
      setChatError(err.message || "Gagal mengambil pesan");
    }
  };

  useEffect(() => {
    if (!userId) return;

    fetchMessages(true);
    const interval = setInterval(() => {
      fetchMessages(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [userId]);

  const value = {
    messages,
    setMessages,
    globalUnreadCount,
    setGlobalUnreadCount,
    fetchMessages,
    lastMessageCountRef,
    userId,
    chatError
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
