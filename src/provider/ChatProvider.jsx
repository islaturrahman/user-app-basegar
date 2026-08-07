import React, { useState, useEffect, useRef } from 'react';
import ChatContext from '../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from '../data/api';
import { get_admin_message } from '../config/enpoints';
import { Audio } from 'expo-av';
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
      if (!Audio || !Audio.Sound) {
        return;
      }
      
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });

      // Trigger physical shake/vibration
      Vibration.vibrate(400);

      const { sound } = await Audio.Sound.createAsync(
        { uri: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" },
        { shouldPlay: true }
      );
      
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          try {
            await sound.unloadAsync();
          } catch (e) {
            console.log("Error unloading sound:", e);
          }
        }
      });
    } catch (error) {
      console.log("Error playing chat sound:", error);
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
        const simplifiedMsg = validMessages.map(m => ({ id: m.id, msg: m.message, reply: m.reply }));
        const newJson = JSON.stringify(simplifiedMsg);
        
        if (isInitial || newJson !== lastMessagesJsonRef.current) {
          const newLen = validMessages.length;
          
          if (!isInitial && lastMessagesJsonRef.current) {
            try {
              const prevMessages = JSON.parse(lastMessagesJsonRef.current);
              
              const getAdminText = (msgs) => msgs
                .filter(m => m.is_reply || Boolean(m.reply))
                .map(m => m.reply || "")
                .join("||");
              const prevAdminText = getAdminText(prevMessages);
              const newAdminText = getAdminText(messagesArray);
              
              if (prevAdminText !== newAdminText) {
                playSound();
                setGlobalUnreadCount(prev => prev + 1);
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
