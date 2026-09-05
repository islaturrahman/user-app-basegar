import React, { useEffect, useRef, useState, useCallback, useContext, useMemo } from 'react';
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
import { base_url, AGORA_APP_ID, AGORA_TOKEN } from '../../../config/enpoints';

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

// Real-time Video Player powered by Agora RTC SDK (Audience Live Mode) - Memoized for Industry Standard Performance
function VideoPlayerMock({ session, sessionIdParam }) {
  const [liveFrame, setLiveFrame] = useState(null);
  const [isAgoraConnected, setIsAgoraConnected] = useState(false);
  const sessionIdRaw = (sessionIdParam || session?.id || '1').toString().replace('server-', '').replace('live-00', '');
  const agoraChannel = session?.agora_token ? session.agora_channel : (AGORA_TOKEN ? "basegar_live_42" : (session?.agora_channel || `basegar_live_${sessionIdRaw}`));
  const agoraAppId = session?.agora_app_id || AGORA_APP_ID;
  const agoraToken = session?.agora_token || AGORA_TOKEN || null;

  useEffect(() => {
    console.log('[AGORA RTC CHANNEL TARGET]', agoraChannel);
  }, [agoraChannel]);

  const agoraViewerHtml = useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body, html { width:100vw; height:100vh; overflow:hidden; background:#000; display:flex; align-items:center; justify-content:center; }
        #agora-player { width:100vw; height:100vh; position:absolute; top:0; left:0; overflow:hidden; background:#000; }
        #agora-player * { width:100% !important; height:100% !important; object-fit:cover !important; }
        #status-badge { position:absolute; top:12px; right:12px; background:rgba(22,163,74,0.9); color:white; font-family:sans-serif; font-size:10px; font-weight:bold; padding:4px 8px; border-radius:12px; z-index:99; }
      </style>
      <script src="https://download.agora.io/sdk/release/AgoraRTC_N-4.20.0.js"></script>
    </head>
    <body>
      <div id="status-badge">⚡ AGORA RTC 60 FPS LIVE</div>
      <div id="agora-player"></div>
      <video id="agora-video-element" autoplay playsinline webkit-playsinline style="width:100vw; height:100vh; object-fit:cover; position:absolute; top:0; left:0; z-index:10; background:#000;"></video>
      <script>
        const rnLog = (msg) => {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'log', message: msg }));
          }
        };

        const appId = "${agoraAppId}";
        const channel = "${agoraChannel}";
        const token = ${agoraToken ? `"${agoraToken}"` : "null"};
        const uid = Math.floor(Math.random() * 899999) + 100000;

        const bindVideoToElement = (videoTrack) => {
          try {
            const videoEl = document.getElementById("agora-video-element");
            const track = videoTrack._mediaStreamTrack || (videoTrack.getMediaStreamTrack && videoTrack.getMediaStreamTrack());
            if (track && videoEl) {
              videoEl.setAttribute('playsinline', 'true');
              videoEl.setAttribute('webkit-playsinline', 'true');
              videoEl.srcObject = new MediaStream([track]);
              const p = videoEl.play();
              if (p !== undefined) {
                p.catch(e => {
                  rnLog('[IOS AUTOPLAY RETRY] Retrying video play: ' + e.message);
                  videoEl.play();
                });
              }
            }
          } catch(e) {
            rnLog('[VIDEO BIND ERR] ' + e.message);
          }
        };

        async function initAgora() {
          try {
            rnLog('[AGORA RTC] Initializing Client for channel: ' + channel);
            let client;
            try {
              client = AgoraRTC.createClient({ mode: "live", codec: "h264" });
            } catch(e) {
              client = AgoraRTC.createClient({ mode: "live", codec: "vp8" });
            }
            await client.setClientRole("audience");

            client.on("user-published", async (user, mediaType) => {
              rnLog('[AGORA RTC] Host published track: ' + mediaType);
              await client.subscribe(user, mediaType);
              if (mediaType === "video") {
                const playerContainer = document.getElementById("agora-player");
                playerContainer.innerHTML = '';
                try {
                  user.videoTrack.play(playerContainer, { fit: "cover" });
                } catch(e) {}

                bindVideoToElement(user.videoTrack);

                rnLog('[AGORA RTC] Smooth Video playing!');
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'agora_connected' }));
                }
              }
              if (mediaType === "audio") {
                rnLog('[AGORA RTC] Host published audio track! Playing remote audio...');
                try {
                  user.audioTrack.setVolume(100);
                  user.audioTrack.play();
                  rnLog('[AGORA RTC] 🔊 Audio playing loud and clear!');
                } catch(e) {
                  rnLog('[AGORA AUDIO ERR] ' + e.message);
                }
              }
            });

            const sendAudienceCount = () => {
              const count = client.remoteUsers ? client.remoteUsers.length : 1;
              rnLog('[AGORA USER VIEWERS COUNT] Active remote users in channel: ' + count);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'viewers_count', count: count }));
              }
            };

            client.on("user-joined", sendAudienceCount);
            client.on("user-left", sendAudienceCount);

            await client.join(appId, channel, token, uid);
            rnLog('[AGORA RTC] Joined channel successfully as Audience UID ' + uid + '!');
            sendAudienceCount();

            // Subscribe to existing host tracks if host was already broadcasting
            if (client.remoteUsers && client.remoteUsers.length > 0) {
              rnLog('[AGORA RTC] Found ' + client.remoteUsers.length + ' existing host(s) in channel!');
              for (const remoteUser of client.remoteUsers) {
                if (remoteUser.hasVideo) {
                  rnLog('[AGORA RTC] Playing existing host video for UID: ' + remoteUser.uid);
                  await client.subscribe(remoteUser, "video");
                  const playerContainer = document.getElementById("agora-player");
                  playerContainer.innerHTML = '';
                  try {
                    remoteUser.videoTrack.play(playerContainer, { fit: "cover" });
                  } catch(e) {}

                  bindVideoToElement(remoteUser.videoTrack);

                  if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'agora_connected' }));
                  }
                }
                if (remoteUser.hasAudio) {
                  rnLog('[AGORA RTC] Playing existing host audio track...');
                  await client.subscribe(remoteUser, "audio");
                  try {
                    remoteUser.audioTrack.setVolume(100);
                    remoteUser.audioTrack.play();
                    rnLog('[AGORA RTC] 🔊 Existing host audio playing!');
                  } catch(e) {}
                }
              }
            }
          } catch (err) {
            rnLog('[AGORA RTC ERROR] ' + err.message);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'agora_error', error: err.message }));
            }
          }
        }

        window.onload = initAgora;
      </script>
    </body>
    </html>
  `, [agoraAppId, agoraChannel, agoraToken]);

  // High-Speed 10 FPS Live Player with AbortController (TikTok Speed)
  useEffect(() => {
    if (isAgoraConnected) return; // Stop frame polling completely when Agora RTC stream is connected!

    let isMounted = true;
    let controller = null;

    const fetchFastFrame = async () => {
      if (!isMounted) return;
      if (controller) controller.abort();
      controller = new AbortController();

      try {
        const targetId = sessionIdRaw || '1';
        const res = await fetch(`${base_url}/api/v1/live-stream/${targetId}/frame`, {
          signal: controller.signal
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json && json.image && json.image.startsWith('data:image')) {
            setLiveFrame(json.image);
          }
        }
      } catch (e) {}
    };

    fetchFastFrame();
    const interval = setInterval(fetchFastFrame, 100); // 100ms = 10 FPS TikTok-speed frame updates!
    return () => {
      isMounted = false;
      if (controller) controller.abort();
      clearInterval(interval);
    };
  }, [sessionIdRaw, isAgoraConnected]);

  return (
    <View style={styles.videoBox}>
      <WebView
        originWhitelist={['*']}
        source={{ html: agoraViewerHtml, baseUrl: 'https://app.agora.io' }}
        style={{ width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000000' }}
        containerStyle={{ width: SCREEN_W, height: SCREEN_H, backgroundColor: '#000000' }}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsProtectedMedia={true}
        useWebKit={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'log') {
              console.log(data.message);
            } else if (data.type === 'agora_connected') {
              console.log('[AGORA RTC] Connected! Hiding frame fallback.');
              setIsAgoraConnected(true);
            } else if (data.type === 'viewers_count') {
              if (data.count && session?.onViewerCountChange) {
                session.onViewerCountChange(data.count);
              }
            } else if (data.type === 'agora_error') {
              console.warn(`[AGORA FALLBACK] Error: ${data.error || 'Connection failed'}. Falling back to Live Stream player...`);
              setIsAgoraConnected(false);
            }
          } catch(e) {
            if (event.nativeEvent.data === 'agora_connected') {
              console.log('[AGORA RTC] Connected! Hiding frame fallback.');
              setIsAgoraConnected(true);
            }
          }
        }}
      />
      
      {!isAgoraConnected && liveFrame && (
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
const VideoPlayerMockMemo = React.memo(VideoPlayerMock);

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
  const [liveRealViewers, setLiveRealViewers] = useState(null);

  const session = sessions.find(s => String(s.id) === String(sessionId) || String(s.id).replace('server-', '') === String(sessionId).replace('server-', ''));

  const activeSessionWithHandler = useMemo(() => {
    if (!session) return null;
    return {
      ...session,
      onViewerCountChange: (count) => setLiveRealViewers(count),
    };
  }, [session]);

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
      <VideoPlayerMockMemo session={activeSessionWithHandler} sessionIdParam={sessionId} />

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
                <Text style={styles.viewerText}>👁 {(liveRealViewers || viewerCount || 1).toLocaleString('id-ID')}</Text>
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
