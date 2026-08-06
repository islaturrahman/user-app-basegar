import React, { useState, useEffect, useRef } from 'react';
import ChatContext from '../context/ChatContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get } from '../data/api';
import { get_admin_message } from '../config/enpoints';
import { Audio } from 'expo-av';

export default function ChatProvider({ children }) {
  const [messages, setMessages] = useState([]);
  const [globalUnreadCount, setGlobalUnreadCount] = useState(0);
  const [userId, setUserId] = useState(null);

  const lastMessageCountRef = useRef(0);
  const lastMessagesJsonRef = useRef("");

  // Get UserId
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const rawUser = await AsyncStorage.getItem("userInfo") || await AsyncStorage.getItem("customer") || await AsyncStorage.getItem("user");
        if (rawUser) {
          const u = JSON.parse(rawUser);
          if (u && u.id) {
            setUserId(u.id);
          }
        }
      } catch (e) {
        console.error("Error reading user ID for chat", e);
      }
    };
    fetchUser();
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
      const response = await get(`${get_admin_message}?user_id=${userId}`);
      if (response && Array.isArray(response.messages)) {
        // Only compare core fields
        const simplifiedMsg = response.messages.map(m => ({ id: m.id, msg: m.message, reply: m.reply }));
        const newJson = JSON.stringify(simplifiedMsg);
        
        if (isInitial || newJson !== lastMessagesJsonRef.current) {
          const newLen = response.messages.length;
          
          if (!isInitial && lastMessagesJsonRef.current) {
            try {
              const prevMessages = JSON.parse(lastMessagesJsonRef.current);
              
              const getAdminText = (msgs) => msgs.map(m => (m.is_reply || Boolean(m.reply)) ? (m.reply || "") : "").join("||");
              const prevAdminText = getAdminText(prevMessages);
              const newAdminText = getAdminText(response.messages);
              
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
          setMessages(response.messages);
        }
      }
    } catch (err) {
      console.error("Failed to load CS messages globally:", err);
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
    userId
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}
