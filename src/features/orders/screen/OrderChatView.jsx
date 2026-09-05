import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  Image,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

import { get, post } from "../../../data/api";
import { base_url } from "../../../config/enpoints";

const toRupiah = (price) => `Rp ${(Number(price) || 0).toLocaleString('id-ID')}`;

export default function OrderChatView() {
  const navigation = useNavigation();
  const route = useRoute();

  const {
    orderId = "10024",
    status = "Dikonfirmasi",
    amount = 0,
    runnerName = "Runner Basegar",
    runnerPhone = "081234567890"
  } = route?.params || {};

  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "system-1",
      sender: "system",
      text: `Sesi Chat Runner dibuka untuk Order #${orderId}. Komunikasi ini khusus untuk koordinasi belanja & pengiriman pesanan Anda.`,
      time: "10:00"
    }
  ]);

  useEffect(() => {
    const showSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Poll order messages directly from backend API for this order_id
  useEffect(() => {
    let isMounted = true;

    const fetchOrderMessages = async () => {
      try {
        const res = await get(`/api/v1/customer/message/get-order-message?order_id=${orderId}`);
        const list = (res && Array.isArray(res.messages)) ? res.messages : (Array.isArray(res) ? res : null);
        
        if (isMounted && list && list.length > 0) {
          const formatted = list.map((m, idx) => {
            const rawText = trim(m.message || m.reply || '');
            const cleanText = trim(rawText.replace(/\[ORDER:.*?\]/g, ''));
            const isCustomer = (m.customer_id !== null && m.customer_id !== undefined) || m.sender_type === 'customer' || m.sender === 'customer';
            
            return {
              id: m.id || `msg-${idx}`,
              sender: isCustomer ? 'customer' : 'runner',
              target: m.target || 'runner',
              chat_type: m.chat_type || 'runner',
              text: cleanText || rawText,
              time: m.created_at ? new Date(m.created_at.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Baru saja',
              created_at: m.created_at || new Date().toISOString()
            };
          });

          setMessages(prev => {
            const systemMsg = prev.filter(p => p.sender === 'system');
            const sortedList = [...formatted].sort((a, b) => {
              const t1 = a.created_at ? new Date(a.created_at.replace(' ', 'T')).getTime() : 0;
              const t2 = b.created_at ? new Date(b.created_at.replace(' ', 'T')).getTime() : 0;
              return t1 - t2;
            });
            
            const merged = [...systemMsg, ...sortedList];
            const map = new Map();
            const unique = [];
            for (const item of merged) {
              if (!map.has(String(item.id))) {
                map.set(String(item.id), true);
                unique.push(item);
              }
            }
            return unique;
          });
        }
      } catch (err) {
        // Silent catch for polling
      }
    };

    fetchOrderMessages();
    const interval = setInterval(fetchOrderMessages, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [orderId]);

  const quickReplies = [
    { label: "🥬 Pastikan Segar", text: "Mohon bantu pastikan produk sayur / daging dalam keadaan segar ya mas." },
    { label: "📍 Patokan Alamat", text: "Lokasi pengiriman di rumah warna hijau depan pos ronda." },
    { label: "📦 Titip di Pagar", text: "Jika sudah sampai dan tidak ada jawaban, boleh dititip di teras/pagar." }
  ];

  const handleSend = async (customText = null) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || sending) return;

    setInputMessage("");
    setSending(true);

    const tempMsg = {
      id: Date.now(),
      sender: "customer",
      target: "runner",
      chat_type: "runner",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      await post("/api/v1/customer/message/send/customer", {
        order_id: orderId,
        message: textToSend
      });
    } catch (e) {
      console.log("Error sending order chat message:", e);
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  };

  const handleCall = () => {
    if (runnerPhone) {
      Linking.openURL(`tel:${runnerPhone}`).catch(() => {});
    }
  };

  const handleSubstituteAction = (action, itemsStr) => {
    if (action === 'replace') {
      const msg = `🔄 Pengajuan Substitusi: Mohon bantu ganti item (${itemsStr || 'tidak tersedia'}) dengan produk alternatif yang sejenis ya mas.`;
      handleSendMessage(msg);
      Alert.alert('Permintaan Terkirim', 'Runner telah menerima permintaan penggantian barang alternatif.');
    } else if (action === 'cancel') {
      Alert.alert(
        'Konfirmasi Batalkan Item',
        `Apakah Anda yakin ingin membatalkan item (${itemsStr || 'produk ini'}) dari pesanan Anda?`,
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Ya, Batalkan Item',
            style: 'destructive',
            onPress: async () => {
              const msg = `❌ Pembatalan Item: Baik mas, tolong batalkan item (${itemsStr || 'tidak tersedia'}) ini dari pesanan saya.`;
              handleSendMessage(msg);

              try {
                const res = await post('/api/v1/customer/order/cancel-item', {
                  order_id: orderId,
                  item_name: itemsStr
                });
                if (res && res.message) {
                  Alert.alert('Item Dibatalkan', `Item berhasil dibatalkan dari pesanan & total tagihan Admin diperbarui.`);
                } else {
                  Alert.alert('Item Dibatalkan', 'Permintaan pembatalan item telah dikirimkan ke Runner & Admin.');
                }
              } catch (e) {
                console.log('Cancel item API note:', e?.message || e);
                Alert.alert('Item Dibatalkan', 'Permintaan pembatalan item telah dikirimkan ke Runner.');
              }
            }
          }
        ]
      );
    }
  };

  const renderMessageContent = (content, isCustomer = false) => {
    if (typeof content !== 'string') return <Text className={`text-xs ${isCustomer ? 'text-white' : 'text-gray-800'}`}>{String(content)}</Text>;

    // 1. PRODUCT EMBED MATCH: [PRODUCT:id=...|name=...|price=...|image=...]
    if (content.includes("[PRODUCT:")) {
      try {
        const matches = content.match(/\[PRODUCT:id=(.*?)\|name=(.*?)\|price=(.*?)\|image=(.*?)(?:\|stock=(.*?))?\]/);
        if (matches) {
          const p_id = matches[1];
          const p_name = decodeURIComponent(matches[2] || '');
          const p_price = parseFloat(matches[3] || 0);
          const p_image = decodeURIComponent(matches[4] || '');
          const cleanMsg = content.replace(/\[PRODUCT:.*?\]/g, '').trim();

          return (
            <View className="flex-col">
              <TouchableOpacity 
                onPress={() => navigation.navigate('/p/:id', { id: p_id })}
                className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 w-[220px] shadow-sm mb-1"
                activeOpacity={0.85}
              >
                <View className="flex-row items-center mb-2">
                  <View className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 mr-2.5">
                    {p_image ? (
                      <Image source={{ uri: p_image }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                      <FontAwesome5 name="shopping-basket" size={18} color="#059669" style={{ alignSelf: 'center', marginTop: 12 }} />
                    )}
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className="text-[9px] font-extrabold text-emerald-800 uppercase mb-0.5">
                      {isCustomer ? "Produk Ditanyakan 🛍️" : "Pengajuan Produk 🛍️"}
                    </Text>
                    <Text className="text-[11px] font-bold text-gray-900" numberOfLines={2}>
                      {p_name}
                    </Text>
                    <Text className="text-xs font-extrabold text-red-600 mt-0.5">
                      {toRupiah(p_price)}
                    </Text>
                  </View>
                </View>

                <View className="bg-emerald-600 rounded-lg py-1 flex-row items-center justify-center">
                  <Text className="text-white text-[10px] font-bold mr-1">Lihat Detail Produk</Text>
                  <Ionicons name="chevron-forward" size={12} color="white" />
                </View>
              </TouchableOpacity>
              {cleanMsg ? (
                <Text className={`text-xs mt-1 leading-4 ${isCustomer ? "text-white" : "text-gray-800"}`}>
                  {cleanMsg}
                </Text>
              ) : null}
            </View>
          );
        }
      } catch (e) {
        console.log("Error parsing product embed:", e);
      }
    }

    // 2. SUBSTITUTION REQUEST EMBED MATCH: [SUBSTITUTION:items=...|note=...]
    if (content.includes("[SUBSTITUTION:")) {
      try {
        const matches = content.match(/\[SUBSTITUTION:items=(.*?)(?:\|note=(.*?))?\]/);
        if (matches) {
          const itemsStr = decodeURIComponent(matches[1] || '');
          const noteStr = decodeURIComponent(matches[2] || '');
          const cleanMsg = content.replace(/\[SUBSTITUTION:.*?\]/g, '').trim();

          return (
            <View className="flex-col">
              <View
                style={{
                  backgroundColor: '#fffbeb',
                  borderWidth: 1,
                  borderColor: '#fcd34d',
                  borderRadius: 12,
                  padding: 10,
                  width: 235,
                  marginBottom: 4,
                }}
              >
                <View className="flex-row items-center mb-1.5">
                  <FontAwesome5 name="exclamation-triangle" size={13} color="#d97706" />
                  <Text
                    style={{ fontSize: 10, fontWeight: '800', color: '#78350f', textTransform: 'uppercase', marginLeft: 6 }}
                  >
                    Pengajuan Substitusi ⚠️
                  </Text>
                </View>

                <Text className="text-[10px] text-gray-600 font-semibold mb-1">Barang Tidak Tersedia:</Text>
                <View
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: '#fde68a',
                    marginBottom: 6,
                  }}
                >
                  <Text className="text-[11px] font-bold text-gray-900 leading-4">{itemsStr || "Beberapa produk kosong"}</Text>
                </View>

                {noteStr ? (
                  <Text className="text-[10px] text-gray-600 italic mb-1.5">
                    Catatan Runner: "{noteStr}"
                  </Text>
                ) : null}

                {/* Dynamic Action Buttons */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 4,
                    paddingTop: 6,
                    borderTopWidth: 1,
                    borderTopColor: '#fde68a',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => handleSubstituteAction('replace', itemsStr)}
                    className="bg-emerald-600 rounded-lg py-1.5 px-2 flex-1 flex-row items-center justify-center mr-1 shadow-sm"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="swap-horizontal" size={11} color="white" />
                    <Text className="text-white text-[9.5px] font-extrabold ml-1">Ganti yang Lain</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleSubstituteAction('cancel', itemsStr)}
                    className="bg-rose-600 rounded-lg py-1.5 px-2 flex-1 flex-row items-center justify-center shadow-sm"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={11} color="white" />
                    <Text className="text-white text-[9.5px] font-extrabold ml-1">Batalkan Item Ini</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('/o/:id', { id: orderId })}
                  style={{
                    backgroundColor: '#d97706',
                    borderRadius: 8,
                    paddingVertical: 4,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 6,
                  }}
                >
                  <Text className="text-white text-[9.5px] font-bold mr-1">Cek Detail Order</Text>
                  <Ionicons name="chevron-forward" size={11} color="white" />
                </TouchableOpacity>
              </View>

              {cleanMsg ? (
                <Text className={`text-xs mt-1 leading-4 ${isCustomer ? "text-white" : "text-gray-800"}`}>
                  {cleanMsg}
                </Text>
              ) : null}
            </View>
          );
        }
      } catch (e) {
        console.log("Error parsing substitution embed:", e);
      }
    }

    // Default plain text
    return (
      <Text className={`text-xs font-normal leading-4 ${isCustomer ? 'text-white' : 'text-gray-800'}`}>
        {content}
      </Text>
    );
  };

  const renderMessage = ({ item }) => {
    if (item.sender === 'system') {
      return (
        <View className="my-2.5 items-center px-4">
          <View className="bg-gray-200/80 rounded-full px-3 py-1">
            <Text className="text-[10px] text-gray-600 font-medium text-center">{item.text}</Text>
          </View>
        </View>
      );
    }

    const isCustomer = item.sender === 'customer';

    return (
      <View className={`my-1.5 flex-row ${isCustomer ? 'justify-end' : 'justify-start'}`}>
        {!isCustomer && (
          <View className="w-7 h-7 rounded-full bg-emerald-700 items-center justify-center mr-2 self-end mb-1">
            <FontAwesome5 name="motorcycle" size={12} color="white" />
          </View>
        )}

        <View 
          className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl shadow-sm ${
            isCustomer 
              ? 'bg-emerald-600 rounded-br-none' 
              : 'bg-white rounded-bl-none border border-gray-100'
          }`}
        >
          {!isCustomer && (
            <Text className="text-[10px] font-bold text-emerald-800 mb-0.5">Runner Basegar</Text>
          )}
          
          {renderMessageContent(item.text, isCustomer)}

          <Text className={`text-[9px] font-medium mt-1 text-right ${isCustomer ? 'text-emerald-200' : 'text-gray-400'}`}>
            {item.time}
          </Text>

          {/* Debug Text Kecil Target */}
          <Text className={`text-[8px] font-mono mt-0.5 text-right ${isCustomer ? "text-emerald-200/80" : "text-gray-400/80"}`}>
            [DEBUG] target:{String(item.target ?? 'null')} | chat_type:{String(item.chat_type ?? 'null')} | order:{String(orderId ?? '-')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fa]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View className={`bg-white border-b border-gray-100 px-4 py-3 flex-row items-center justify-between z-10 shadow-sm ${Platform.OS === 'android' ? 'mt-8' : ''}`}>
          <View className="flex-row items-center flex-1">
            <TouchableOpacity 
              onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('/')}
              className="mr-2.5 w-8 h-8 rounded-full items-center justify-center bg-gray-100"
            >
              <Ionicons name="chevron-back" size={20} color="#374151" />
            </TouchableOpacity>

            <View className="relative">
              <View className="w-10 h-10 rounded-full bg-emerald-700 items-center justify-center shadow-sm">
                <FontAwesome5 name="motorcycle" size={16} color="white" />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </View>

            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                Chat Runner (Order #{orderId})
              </Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                <Text className="text-[10px] text-emerald-600 font-bold">
                  Shopper & Delivery • Online 🛵
                </Text>
              </View>
              {/* Debug Header Info */}
              <Text className="text-[8px] text-gray-500 font-mono mt-0.5" numberOfLines={1}>
                🔍 Debug Targets: [{Array.from(new Set(messages.map(m => String(m.target ?? 'null')))).join(', ')}] | Total Msg: {messages.length}
              </Text>
            </View>
          </View>

          {/* Quick Call Button */}
          <TouchableOpacity 
            onPress={handleCall}
            className="w-9 h-9 rounded-full bg-emerald-50 items-center justify-center border border-emerald-200 ml-2"
          >
            <Ionicons name="call" size={18} color="#047857" />
          </TouchableOpacity>
        </View>

        {/* Order Banner Summary */}
        <View className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex-row items-center justify-between">
          <View className="flex-row items-center space-x-1">
            <Text className="text-[11px] font-bold text-emerald-900">
              Order #{orderId} • Status: <Text className="font-extrabold uppercase text-emerald-700">{status}</Text>
            </Text>
          </View>
          {amount > 0 ? (
            <Text className="text-[11px] font-extrabold text-emerald-900">
              {toRupiah(amount)}
            </Text>
          ) : null}
        </View>

        {/* Chat Messages */}
        <View className="flex-1 px-4">
          <FlatList
            ref={flatListRef}
            data={[...messages.filter(m => m.sender === 'system' || m.chat_type === 'runner' || m.target === 'runner' || (!m.chat_type && m.sender !== 'cs'))].reverse()}
            inverted={true}
            keyExtractor={item => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingVertical: 12 }}
          />
        </View>

        {/* Quick Replies */}
        <View className="bg-white border-t border-gray-100 px-3 py-2">
          <Text className="text-[9.5px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Pesan Cepat Pelanggan ⚡
          </Text>
          <FlatList 
            horizontal
            showsHorizontalScrollIndicator={false}
            data={quickReplies}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSend(item.text)}
                className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full mr-2"
                activeOpacity={0.7}
              >
                <Text className="text-[10.5px] font-bold text-emerald-800">{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Input Bar */}
        <View className="bg-white border-t border-gray-100 px-4 py-2.5 flex-row items-center">
          <TextInput 
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Tulis pesan untuk Runner..."
            placeholderTextColor="#9ca3af"
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-800 mr-2 max-h-24"
            multiline
          />
          <TouchableOpacity 
            onPress={() => handleSend()}
            disabled={!inputMessage.trim()}
            className={`w-9 h-9 rounded-full items-center justify-center ${
              inputMessage.trim() ? "bg-emerald-600 shadow-sm" : "bg-gray-200"
            }`}
          >
            <Ionicons name="send" size={16} color="white" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function trim(str) {
  return str ? String(str).trim() : '';
}
