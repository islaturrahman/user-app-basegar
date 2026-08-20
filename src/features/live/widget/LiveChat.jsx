import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Animated
} from 'react-native';
import { LiveContext } from '../provider/LiveProvider';
import { Send, Heart } from 'lucide-react-native';

function ChatBubble({ item, isNew }) {
  const fadeAnim = useRef(new Animated.Value(isNew ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(isNew ? 10 : 0)).current;

  useEffect(() => {
    if (isNew) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]).start();
    }
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginBottom: 4 }}>
      <View style={[styles.bubble, item.isMine && styles.bubbleMine]}>
        {!item.isMine && (
          <Text style={styles.bubbleUser}>{item.user} </Text>
        )}
        <Text style={[styles.bubbleText, item.isMine && styles.bubbleTextMine]}>{item.message}</Text>
      </View>
    </Animated.View>
  );
}

// Floating hearts animation
function FloatingHeart({ onDone }) {
  const posY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const offsetX = (Math.random() - 0.5) * 40;
  const emoji = ['❤️', '🧡', '💚', '💛', '💜'][Math.floor(Math.random() * 5)];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(posY, { toValue: -120, duration: 1800, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 1800, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.Text style={{
      position: 'absolute', bottom: 10, right: 20 + offsetX,
      fontSize: 22, opacity, transform: [{ translateY: posY }]
    }}>
      {emoji}
    </Animated.Text>
  );
}

export default function LiveChat({ sessionId, collapsed = false }) {
  const { chats, sendChat } = useContext(LiveContext);
  const [message, setMessage] = useState('');
  const [hearts, setHearts] = useState([]);
  const listRef = useRef(null);
  const lastChatCount = useRef(chats.length);
  const heartIdRef = useRef(0);

  // Auto-scroll ke bawah saat pesan baru masuk
  useEffect(() => {
    if (chats.length > lastChatCount.current) {
      lastChatCount.current = chats.length;
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chats]);

  const handleSend = () => {
    if (!message.trim()) return;
    sendChat(message);
    setMessage('');
  };

  const handleHeart = () => {
    const id = heartIdRef.current++;
    setHearts(prev => [...prev, id]);
  };

  const removeHeart = (id) => {
    setHearts(prev => prev.filter(h => h !== id));
  };

  if (collapsed) {
    // Mode mini: tampilkan 2 pesan terakhir saja
    const recent = chats.slice(-2);
    return (
      <View style={styles.collapsedContainer}>
        {recent.map(c => (
          <View key={c.id} style={styles.collapsedBubble}>
            <Text style={styles.collapsedUser}>{c.user} </Text>
            <Text style={styles.collapsedMsg} numberOfLines={1}>{c.message}</Text>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* List Chat */}
      <FlatList
        ref={listRef}
        data={chats}
        keyExtractor={item => item.id}
        style={styles.chatList}
        contentContainerStyle={{ padding: 10, paddingBottom: 4 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <ChatBubble item={item} isNew={index >= chats.length - 3} />
        )}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Floating Hearts */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {hearts.map(id => (
          <FloatingHeart key={id} onDone={() => removeHeart(id)} />
        ))}
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Tulis komentar..."
          placeholderTextColor="rgba(255,255,255,0.45)"
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity onPress={handleHeart} style={styles.heartBtn}>
          <Heart size={20} color="#f87171" fill="#f87171" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendBtn, !message.trim() && styles.sendBtnDisabled]}
          disabled={!message.trim()}
        >
          <Send size={16} color="white" strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatList: {
    flex: 1,
    maxHeight: 180,
  },
  bubble: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignSelf: 'flex-start',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    maxWidth: '80%',
    marginBottom: 2,
  },
  bubbleMine: {
    backgroundColor: 'rgba(21,128,61,0.75)',
    alignSelf: 'flex-end',
  },
  bubbleUser: {
    color: '#86efac',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  bubbleText: {
    color: 'white',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  bubbleTextMine: {
    color: '#dcfce7',
  },
  collapsedContainer: {
    gap: 3,
    paddingHorizontal: 12,
    paddingBottom: 4,
  },
  collapsedBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  collapsedUser: { color: '#86efac', fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
  collapsedMsg: { color: 'white', fontFamily: 'Poppins_400Regular', fontSize: 10, flex: 1 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    color: 'white',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  heartBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
