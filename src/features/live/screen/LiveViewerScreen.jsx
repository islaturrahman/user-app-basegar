import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  Platform, StatusBar, Animated, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { LiveContext } from '../provider/LiveProvider';
import CartContext from '../../../context/CartContext';
import LiveProductCarousel from '../widget/LiveProductCarousel';
import LiveChat from '../widget/LiveChat';
import LiveFlashSale from '../widget/LiveFlashSale';
import { BlankBottomSheet } from '../../../components/BlankBottomSheet';
import { ShoppingCart, ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { base_url } from '../../../config/enpoints';

let WebRTC = null;
try {
  WebRTC = require('react-native-webrtc');
} catch (e) {}
const { RTCPeerConnection, RTCSessionDescription, RTCView } = WebRTC || {};

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Animated "LIVE" pulse dot
function LiveDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
      <Animated.View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#fca5a5', opacity: 0.5, transform: [{ scale }] }} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ef4444' }} />
    </View>
  );
}

// Dynamic Realtime Video Player View for Live Stream with Real-time Camera Frame Receiver
function VideoPlayerMock({ session, sessionIdParam }) {
  const [remoteStream, setRemoteStream] = useState(null);
  const [liveFrame, setLiveFrame] = useState(null);
  const [isWebRTCConnected, setIsWebRTCConnected] = useState(false);
  const sessionIdRaw = (sessionIdParam || session?.id || '1').toString().replace('server-', '').replace('live-00', '');
  const liveKitRoom = `room_live_${sessionIdRaw}`;

  const liveKitViewerHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body, html { width:100vw; height:100vh; overflow:hidden; background:transparent; display:flex; align-items:center; justify-content:center; }
        video { width:100%; height:100%; object-fit:cover; position:absolute; top:0; left:0; }
        #status-badge { position:absolute; top:12px; right:12px; background:rgba(34,197,94,0.85); color:white; font-family:sans-serif; font-size:10px; font-weight:bold; padding:4px 8px; borderRadius:12px; z-index:99; }
      </style>
    </head>
    <body>
      <div id="status-badge">⚡ WEBRTC 30 FPS P2P</div>
      <video id="remoteVideo" autoplay playsinline></video>
      <script>
        // Forward logs to React Native Metro
        const rnLog = (msg) => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
          }
        };
        console.log = function(...args) { rnLog('[WEBVIEW LOG] ' + args.join(' ')); };
        console.error = function(...args) { rnLog('[WEBVIEW ERROR] ' + args.join(' ')); };

        const sessionId = "${sessionIdRaw}";
        const baseUrl = "${base_url}";
        const signalUrl = baseUrl + "/api/v1/live-stream/signal";
        const video = document.getElementById('remoteVideo');
        
        let pc = null;
        let pollInterval = null;

        async function joinStream() {
          try {
            rnLog('[WEBRTC] Starting Viewer polling for offer...');
            pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
            
            pc.ontrack = (event) => {
              rnLog('[WEBRTC] Video Track Received!');
              if (event.streams && event.streams[0]) {
                video.srcObject = event.streams[0];
                video.style.backgroundColor = '#000';
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'webrtc_connected' }));
                }
              }
            };

            pollInterval = setInterval(async () => {
              try {
                const res = await fetch(signalUrl + '/' + sessionId);
                const sig = await res.json();
                
                if (sig && sig.offer && (!pc.remoteDescription || pc.remoteDescription.type !== 'offer')) {
                  clearInterval(pollInterval);
                  rnLog('[WEBRTC] Found offer! Creating answer...');
                  
                  const offerObj = JSON.parse(sig.offer);
                  await pc.setRemoteDescription(new RTCSessionDescription(offerObj));
                  
                  const answer = await pc.createAnswer();
                  await pc.setLocalDescription(answer);

                  await fetch(signalUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ session_id: sessionId, type: 'answer', data: JSON.stringify(answer) })
                  });
                  rnLog('[WEBRTC] Answer sent. Connected!');
                }
              } catch (err) {}
            }, 1500);
            
          } catch (err) {
            console.error('Viewer WebRTC error:', err);
          }
        }

        window.onload = joinStream;
      </script>
    </body>
    </html>
  `;

  // Frame Polling Fallback
  useEffect(() => {
    let isMounted = true;
    const parseJson = async (response) => {
      if (!response || !response.ok) return null;
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (e) {
        return null;
      }
    };

    const fetchFrame = async () => {
      try {
        const targetId = sessionIdRaw || '1';
        let url = `${base_url}/api/v1/live-stream/${targetId}/frame`;
        let res = await fetch(url);
        let json = await parseJson(res);

        if (!json || !json.image) {
          const resFB = await fetch(`${base_url}/api/v1/live-stream/1/frame`);
          const jsonFB = await parseJson(resFB);
          if (jsonFB && jsonFB.image) {
            json = jsonFB;
          }
        }

        if (isMounted && json && json.image && json.image.startsWith('data:image')) {
          console.log('[USER LIVE FRAME RECEIVED]', json.image.length, 'bytes');
          setLiveFrame(json.image);
        }
      } catch (e) {
        console.log('[USER LIVE FRAME FETCH ERROR]', e.message);
      }
    };

    fetchFrame();
    const interval = setInterval(fetchFrame, 400);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [sessionIdRaw]);

  return (
    <View style={styles.videoBox}>
      <WebView
        originWhitelist={['*']}
        source={{ html: liveKitViewerHtml }}
        style={{ width: SCREEN_W, height: SCREEN_H, position: 'absolute', top: 0, left: 0, backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'log') {
              console.log(data.message);
            } else if (data.type === 'webrtc_connected') {
              console.log('[WEBRTC] Connected! Hiding frame fallback.');
              setIsWebRTCConnected(true);
            }
          } catch(e) {
            // Fallback for old string messages
            if (event.nativeEvent.data === 'webrtc_connected') {
              console.log('[WEBRTC] Connected! Hiding frame fallback.');
              setIsWebRTCConnected(true);
            }
          }
        }}
      />
      
      {!isWebRTCConnected && liveFrame && (
        <Image
          source={{ uri: liveFrame }}
          style={{ width: SCREEN_W, height: SCREEN_H, position: 'absolute', top: 0, left: 0 }}
          resizeMode="cover"
          pointerEvents="none"
        />
      )}
      <View style={styles.videoOverlay} pointerEvents="none" />
    </View>
  );
}

// Recipe Bundle Bottom Sheet
function RecipeBundleSheet({ bundle, isOpen, onClose, onAddAll }) {
  if (!bundle) return null;
  const total = bundle.totalPrice;
  const discount = bundle.totalPrice - bundle.discountPrice;
  return (
    <BlankBottomSheet isOpen={isOpen} onClose={onClose}>
      <View style={{ padding: 16, paddingBottom: 8 }}>
        <View style={{ width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <View>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#1f2937' }}>🍲 {bundle.name}</Text>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6b7280', marginTop: 2 }}>{bundle.items.length} bahan</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
        {bundle.items.map((item, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: i < bundle.items.length - 1 ? 1 : 0, borderColor: '#f3f4f6', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 20 }}>{item.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#374151' }}>{item.name}</Text>
              <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#9ca3af' }}>{item.unit}</Text>
            </View>
            <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#374151' }}>Rp {item.price.toLocaleString('id-ID')}</Text>
          </View>
        ))}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, marginTop: 4 }}>
          <View>
            <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9ca3af' }}>
              Normal: Rp {total.toLocaleString('id-ID')}
            </Text>
            <Text style={{ fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#15803d' }}>
              Paket: Rp {bundle.discountPrice.toLocaleString('id-ID')}
            </Text>
            <Text style={{ fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#16a34a' }}>
              Hemat Rp {discount.toLocaleString('id-ID')} 🎉
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addAllBtn} onPress={onAddAll}>
          <ShoppingCart size={16} color="white" />
          <Text style={styles.addAllBtnText}>Tambah Semua ke Keranjang 🛒</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginBottom: 4 }}>
          ✅ Anda bisa lanjut nonton setelahnya
        </Text>
      </View>
    </BlankBottomSheet>
  );
}

export default function LiveViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id: sessionId } = route.params || {};
  const { sessions, chats, viewerCount, joinSession, leaveSession } = useContext(LiveContext);
  const { cart, addToCart } = useContext(CartContext) || {};
  const [chatExpanded, setChatExpanded] = useState(false);
  const [showRecipeBundle, setShowRecipeBundle] = useState(false);
  const [bundleAdded, setBundleAdded] = useState(false);

  const session = sessions.find(s => String(s.id) === String(sessionId) || String(s.id).replace('server-', '') === String(sessionId).replace('server-', ''));

  useEffect(() => {
    if (sessionId) joinSession(sessionId);
    return () => leaveSession();
  }, [sessionId]);

  // Auto-show recipe banner after 8 seconds if available
  const recipeBannerShown = useRef(false);
  const [showRecipeBanner, setShowRecipeBanner] = useState(false);
  useEffect(() => {
    if (session?.recipeBundle && !recipeBannerShown.current) {
      const t = setTimeout(() => {
        setShowRecipeBanner(true);
        recipeBannerShown.current = true;
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [session]);

  const handleAddRecipeBundle = useCallback(() => {
    if (!session?.recipeBundle || !addToCart) return;
    session.recipeBundle.items.forEach((item, idx) => {
      addToCart(1000 + idx, item.name, item.price, 1, '', [], 0, null, null);
    });
    setBundleAdded(true);
    setShowRecipeBundle(false);
  }, [session, addToCart]);

  const handleFlashSaleClaim = useCallback(() => {
    if (!session?.flashSale || !addToCart) return;
    addToCart(9999, session.flashSale.productName, session.flashSale.salePrice, 1, '', [], 0, null, null);
  }, [session, addToCart]);

  const cartCount = cart?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;

  if (!session) {
    return (
      <View style={{ flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontFamily: 'Poppins_500Medium', fontSize: 16 }}>Sesi live tidak ditemukan</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16, backgroundColor: '#15803d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 }}>
          <Text style={{ color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 14 }}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* VIDEO PLAYER */}
      <VideoPlayerMock session={session} sessionIdParam={sessionId} />

      {/* OVERLAY UI */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        
        {/* TOP: Back + Session Info + Cart */}
        <View style={styles.topOverlay} pointerEvents="box-none">
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backIcon}>←</Text>
            </TouchableOpacity>

            <View style={styles.sessionInfo}>
              <LiveDot />
              <Text style={styles.sessionTitle} numberOfLines={1}>{session.title}</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={styles.viewerBadge}>
                <Text style={styles.viewerText}>👁 {viewerCount.toLocaleString('id-ID')}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('/cart')} style={styles.cartBtn}>
                <ShoppingCart size={18} color="white" strokeWidth={2} />
                {cartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* BOTTOM: Flash Sale + Recipe Banner + Chat + Products */}
        <View style={styles.bottomOverlay} pointerEvents="box-none">

          {/* Flash Sale Widget */}
          {session.flashSale && (
            <LiveFlashSale flashSale={session.flashSale} onClaim={handleFlashSaleClaim} />
          )}

          {/* Recipe Bundle Banner */}
          {showRecipeBanner && session.recipeBundle && !bundleAdded && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => { setShowRecipeBanner(false); setShowRecipeBundle(true); }}
              style={styles.recipeBanner}
            >
              <Text style={{ fontSize: 24 }}>🍲</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.recipeBannerTitle}>Paket Bahan Resep Ini!</Text>
                <Text style={styles.recipeBannerSub}>{session.recipeBundle.name} • Rp {session.recipeBundle.discountPrice.toLocaleString('id-ID')}</Text>
              </View>
              <Text style={styles.recipeBannerCta}>Lihat →</Text>
              <TouchableOpacity onPress={() => setShowRecipeBanner(false)} style={styles.recipeBannerClose}>
                <X size={12} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}

          {/* Chat Area */}
          <View style={styles.chatArea} pointerEvents="box-none">
            {chatExpanded ? (
              <View style={styles.chatExpanded} pointerEvents="box-none">
                <TouchableOpacity style={styles.collapseBtn} onPress={() => setChatExpanded(false)}>
                  <ChevronDown size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.collapseBtnText}>Sembunyikan chat</Text>
                </TouchableOpacity>
                <LiveChat sessionId={sessionId} collapsed={false} />
              </View>
            ) : (
              <View pointerEvents="box-none">
                <LiveChat sessionId={sessionId} collapsed={true} />
                <TouchableOpacity style={styles.expandChatBtn} onPress={() => setChatExpanded(true)}>
                  <ChevronUp size={12} color="rgba(255,255,255,0.6)" />
                  <Text style={styles.expandChatBtnText}>Chat</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Product Carousel */}
          <LiveProductCarousel sessionId={sessionId} />
        </View>
      </View>

      {/* Recipe Bundle Sheet */}
      <RecipeBundleSheet
        bundle={session.recipeBundle}
        isOpen={showRecipeBundle}
        onClose={() => setShowRecipeBundle(false)}
        onAddAll={handleAddRecipeBundle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoBox: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  videoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.08)' },
  cameraSimContainer: { alignItems: 'center', justifyContent: 'center' },
  videoEmoji: { fontSize: 100, marginBottom: 12 },
  liveStreamHostText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 16, textAlign: 'center', marginTop: 4 },
  liveStreamStatusSub: { color: '#86efac', fontFamily: 'Poppins_500Medium', fontSize: 12, textAlign: 'center', marginTop: 2 },
  laserScanline: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, backgroundColor: '#22c55e', opacity: 0.6 },
  scanlineContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-evenly', opacity: 0.04 },
  scanline: { height: 1, backgroundColor: 'white', width: '100%' },
  topOverlay: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 40 : 52,
    left: 0, right: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: 'white', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  sessionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  sessionTitle: { color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 11, flex: 1 },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  viewerText: { color: 'white', fontFamily: 'Poppins_500Medium', fontSize: 11 },
  cartBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#ef4444', width: 16, height: 16,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'white',
  },
  cartBadgeText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 8 },
  bottomOverlay: {
    position: 'absolute',
    bottom: Platform.OS === 'android' ? 0 : 0,
    left: 0, right: 0,
    paddingBottom: Platform.OS === 'android' ? 8 : 20,
  },
  chatArea: {
    marginHorizontal: 0,
    marginBottom: 4,
  },
  chatExpanded: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    marginHorizontal: 8,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 4,
  },
  collapseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    gap: 4,
  },
  collapseBtnText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_400Regular', fontSize: 11 },
  expandChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 3,
  },
  expandChatBtnText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_400Regular', fontSize: 10 },
  recipeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(21,128,61,0.85)',
    borderRadius: 12,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(134,239,172,0.3)',
  },
  recipeBannerTitle: { color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  recipeBannerSub: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins_400Regular', fontSize: 10 },
  recipeBannerCta: { color: '#86efac', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  recipeBannerClose: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  addAllBtn: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addAllBtnText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 14 },
});
