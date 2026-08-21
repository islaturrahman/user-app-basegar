import React, { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { base_url, active_live_streams } from '../../../config/enpoints';

export const LiveContext = createContext({});

// Mock data — ganti dengan API/WebSocket Livekit saat production
const MOCK_SESSIONS = [
  {
    id: 'live-001',
    title: 'Panen Pagi — Sayur & Buah Segar',
    host: 'Pak Budi',
    hostAvatar: null,
    thumbnailColor: '#166534',
    emoji: '🥬',
    viewerCount: 234,
    status: 'live',
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // HLS test stream
    products: [
      { id: 1, name: 'Kangkung Segar', price: 5000, originalPrice: 7000, unit: '250gr', image: null, emoji: '🥬', stock: 45 },
      { id: 2, name: 'Wortel Lokal', price: 8000, originalPrice: null, unit: '500gr', image: null, emoji: '🥕', stock: 30 },
      { id: 3, name: 'Tomat Merah', price: 12000, originalPrice: 15000, unit: '500gr', image: null, emoji: '🍅', stock: 20 },
      { id: 4, name: 'Bayam Hijau', price: 4000, originalPrice: null, unit: '200gr', image: null, emoji: '🌿', stock: 60 },
      { id: 5, name: 'Jagung Manis', price: 7000, originalPrice: null, unit: '2 pcs', image: null, emoji: '🌽', stock: 15 },
    ],
    flashSale: {
      active: true,
      productName: 'Kangkung Segar JUMBO',
      originalPrice: 12000,
      salePrice: 7500,
      endsAt: new Date(Date.now() + 4 * 60 * 1000 + 52 * 1000).toISOString(), // 4m52s lagi
      totalStock: 100,
      soldCount: 42,
    },
    highlightedProduct: null,
  },
  {
    id: 'live-002',
    title: 'Demo Masak: Sayur Sop Ayam',
    host: 'Bu Sari',
    hostAvatar: null,
    thumbnailColor: '#b45309',
    emoji: '🍲',
    viewerCount: 87,
    status: 'live',
    startedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    products: [
      { id: 6, name: 'Ayam Potong', price: 35000, originalPrice: null, unit: '1kg', image: null, emoji: '🍗', stock: 20 },
      { id: 7, name: 'Kentang', price: 10000, originalPrice: null, unit: '500gr', image: null, emoji: '🥔', stock: 40 },
      { id: 8, name: 'Buncis', price: 8000, originalPrice: null, unit: '250gr', image: null, emoji: '🫘', stock: 35 },
    ],
    recipeBundle: {
      name: 'Paket Sayur Sop Ayam',
      items: [
        { name: 'Ayam Potong', price: 35000, unit: '1kg', emoji: '🍗' },
        { name: 'Kentang', price: 10000, unit: '500gr', emoji: '🥔' },
        { name: 'Buncis', price: 8000, unit: '250gr', emoji: '🫘' },
        { name: 'Wortel', price: 8000, unit: '250gr', emoji: '🥕' },
        { name: 'Kol', price: 5000, unit: '1/4 biji', emoji: '🥬' },
        { name: 'Daun Bawang', price: 3000, unit: '1 ikat', emoji: '🌿' },
      ],
      totalPrice: 69000,
      discountPrice: 62000,
    },
    flashSale: null,
    highlightedProduct: null,
  },
  {
    id: 'live-003',
    title: 'Ikan & Seafood Segar Hari Ini',
    host: 'Mang Ujang',
    hostAvatar: null,
    thumbnailColor: '#0369a1',
    emoji: '🐟',
    viewerCount: 412,
    status: 'live',
    startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    streamUrl: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    products: [
      { id: 9, name: 'Ikan Kakap Merah', price: 45000, originalPrice: 60000, unit: '500gr', image: null, emoji: '🐟', stock: 8 },
      { id: 10, name: 'Udang Vaname', price: 55000, originalPrice: null, unit: '500gr', image: null, emoji: '🦐', stock: 12 },
      { id: 11, name: 'Cumi-Cumi', price: 38000, originalPrice: null, unit: '500gr', image: null, emoji: '🦑', stock: 5 },
    ],
    flashSale: null,
    highlightedProduct: {
      id: 9, name: 'Ikan Kakap Merah', price: 45000, originalPrice: 60000, unit: '500gr', emoji: '🐟', stock: 8
    },
  },
];

const MOCK_SCHEDULED = [
  { id: 's1', title: 'Pasar Pagi — Buah Tropis', host: 'Pak Budi', scheduledAt: '06:00', date: 'Besok', emoji: '🍉' },
  { id: 's2', title: 'Demo Masak: Rendang Sapi', host: 'Bu Sari', scheduledAt: '10:00', date: 'Besok', emoji: '🍖' },
  { id: 's3', title: 'Flash Sale Malam — Sayur Organik', host: 'Basegar Team', scheduledAt: '19:00', date: 'Besok', emoji: '⚡' },
];

const MOCK_CHATS = [
  { id: 'c1', user: 'Ani Suryani', message: 'Wah kangkungnya segar banget! 😍', time: Date.now() - 30000 },
  { id: 'c2', user: 'Budi Santoso', message: 'Beli 2 ya kak, bisa?', time: Date.now() - 25000 },
  { id: 'c3', user: 'Citra Dewi', message: '🔥🔥🔥 langsung order!', time: Date.now() - 20000 },
  { id: 'c4', user: 'Dian Pratiwi', message: 'Itu wortelnya gimana kondisinya kak?', time: Date.now() - 15000 },
  { id: 'c5', user: 'Eko Raharjo', message: '❤️❤️', time: Date.now() - 10000 },
  { id: 'c6', user: 'Fani Rizky', message: 'Mantap pak Budi! Langganan terus nih', time: Date.now() - 5000 },
];

// Animasi chat baru secara periodik untuk simulasi live feel
const INCOMING_CHATS = [
  { user: 'Gilang', message: 'Beli 1kg ya!' },
  { user: 'Heni', message: 'Pengiriman ke Bandung bisa ga?' },
  { user: 'Irfan', message: '❤️❤️❤️' },
  { user: 'Julia', message: 'Wooo murah banget!' },
  { user: 'Kiki', message: 'Stok masih banyak ga kak?' },
  { user: 'Lena', message: 'Segar banget ini!!! 🥬' },
  { user: 'Mira', message: 'Sudah order tadi, semangat pak!' },
  { user: 'Nino', message: 'Flash sale kapan lagi nih? 🔥' },
];

export default function LiveProvider({ children }) {
  const [sessions, setSessions] = useState(MOCK_SESSIONS);
  const [scheduled, setScheduled] = useState(MOCK_SCHEDULED);
  const [activeSession, setActiveSession] = useState(null);
  const [chats, setChats] = useState(MOCK_CHATS);
  const [viewerCount, setViewerCount] = useState(234);
  const chatIntervalRef = useRef(null);
  const viewerIntervalRef = useRef(null);
  const chatIdRef = useRef(100);

  // Fetch active streams from server
  useEffect(() => {
    const fetchActiveStreams = async () => {
      try {
        const res = await fetch(`${base_url}${active_live_streams}`);
        const data = await res.json();
        if (data && Array.isArray(data.data) && data.data.length > 0) {
          const apiSessions = data.data.map(item => ({
            id: `server-${item.id}`,
            title: item.title || 'Live Stream Merchant',
            host: `Merchant #${item.seller_id || 1}`,
            hostAvatar: null,
            thumbnailColor: '#166534',
            emoji: '🔴',
            viewerCount: item.viewer_count || 15,
            status: 'live',
            startedAt: item.started_at || new Date().toISOString(),
            streamUrl: item.stream_url || 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            agora_channel: item.agora_channel || `basegar_live_${item.id}`,
            agora_token: item.agora_token || null,
            agora_app_id: item.agora_app_id || null,
            products: item.products && item.products.length > 0 ? item.products.map(p => ({
              id: p.product_id,
              name: p.product?.name || `Produk #${p.product_id}`,
              price: p.custom_price || p.product?.price || 10000,
              emoji: '📦'
            })) : [
              { id: 1, name: 'Kangkung Segar', price: 5000, originalPrice: 7000, unit: '250gr', emoji: '🥬', stock: 45 },
              { id: 2, name: 'Wortel Lokal', price: 8000, originalPrice: null, unit: '500gr', emoji: '🥕', stock: 30 }
            ]
          }));
          
          // Deduplicate and prepend server streams
          setSessions(prev => {
            const mockOnly = MOCK_SESSIONS;
            return [...apiSessions, ...mockOnly];
          });
        }
      } catch (e) {
        // keep fallback mock sessions
      }
    };

    fetchActiveStreams();
    const interval = setInterval(fetchActiveStreams, 4000);
    return () => clearInterval(interval);
  }, []);

  const joinSession = useCallback((sessionId) => {
    const session = sessions.find(s => String(s.id) === String(sessionId) || String(s.id).replace('server-', '') === String(sessionId).replace('server-', ''));
    if (session) {
      setActiveSession(session);
      setChats(MOCK_CHATS);
      setViewerCount(session.viewerCount);
    }
  }, [sessions]);

  const leaveSession = useCallback(() => {
    setActiveSession(null);
  }, []);

  // Simulasi chat masuk & viewer count berubah saat sedang live
  useEffect(() => {
    if (activeSession) {
      chatIntervalRef.current = setInterval(() => {
        const randomChat = INCOMING_CHATS[Math.floor(Math.random() * INCOMING_CHATS.length)];
        const newChat = {
          id: `c${chatIdRef.current++}`,
          user: randomChat.user,
          message: randomChat.message,
          time: Date.now(),
        };
        setChats(prev => [...prev.slice(-30), newChat]); // max 30 pesan
      }, 3000 + Math.random() * 4000); // setiap 3-7 detik

      viewerIntervalRef.current = setInterval(() => {
        setViewerCount(prev => {
          const delta = Math.floor(Math.random() * 7) - 3; // -3 to +3
          return Math.max(50, prev + delta);
        });
      }, 5000);

      return () => {
        clearInterval(chatIntervalRef.current);
        clearInterval(viewerIntervalRef.current);
      };
    }
  }, [activeSession]);

  const sendChat = useCallback((message) => {
    if (!message.trim()) return;
    const newChat = {
      id: `c${chatIdRef.current++}`,
      user: 'Saya',
      message: message.trim(),
      time: Date.now(),
      isMine: true,
    };
    setChats(prev => [...prev.slice(-30), newChat]);
  }, []);

  return (
    <LiveContext.Provider value={{
      sessions,
      scheduled,
      activeSession,
      chats,
      viewerCount,
      joinSession,
      leaveSession,
      sendChat,
    }}>
      {children}
    </LiveContext.Provider>
  );
}
