import React, { useState, useEffect, useRef, useContext } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import { post } from "../../../data/api";
import { send_admin_message, base_url } from "../../../config/enpoints";
import ChatContext from "../../../context/ChatContext";

// Utility to format price
const toRupiah = (price) => `Rp ${(Number(price) || 0).toLocaleString('id-ID')}`;

export default function ChatCsView() {
  const navigation = useNavigation();
  const route = useRoute();
  
  const { 
    messages, 
    setMessages, 
    fetchMessages, 
    globalUnreadCount,
    setGlobalUnreadCount, 
    userId,
    lastMessageCountRef 
  } = useContext(ChatContext) || { messages: [], globalUnreadCount: 0 };

  const [inputMessage, setInputMessage] = useState("");
  const [productEmbed, setProductEmbed] = useState(route.params?.productEmbed || "");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Clear unread count when opening the chat screen
    if (setGlobalUnreadCount) {
      setGlobalUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) setLoading(false);
    
    // Fallback if there are truly no messages
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [messages]);

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
    setShowScrollBottomBtn(false);
    if (setGlobalUnreadCount) setGlobalUnreadCount(0);
  };

  const handleSend = async () => {
    if (!inputMessage.trim() && !productEmbed) return;
    if (sending) return;

    let textToSend = inputMessage.trim();
    if (productEmbed) {
      textToSend = textToSend ? `${productEmbed}\n${textToSend}` : productEmbed;
    }
    
    setInputMessage("");
    setProductEmbed("");
    setSending(true);

    const tempMsg = {
      id: Date.now(),
      message: textToSend,
      reply: null,
      is_reply: false,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => {
      const next = [...prev, tempMsg];
      if (lastMessageCountRef) lastMessageCountRef.current = next.length;
      return next;
    });
    
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }, 100);

    try {
      await post(send_admin_message, {
        message: textToSend,
        user_id: userId
      });
      await fetchMessages(false);
    } catch (err) {
      console.error("Failed to send CS message:", err);
    } finally {
      setSending(false);
    }
  };

  const renderMessageContent = (content, isAdmin = false) => {
    if (typeof content === "string" && content.includes("[PRODUCT:")) {
      try {
        const matches = content.match(/\[PRODUCT:id=(.*?)\|name=(.*?)\|price=(.*?)\|image=(.*?)\|stock=(.*?)\]/);
        if (matches) {
          const p_id = matches[1];
          const p_name = decodeURIComponent(matches[2]);
          const p_price = parseFloat(matches[3]);
          const p_image = decodeURIComponent(matches[4]);
          const cleanMsg = content.replace(/\[PRODUCT:.*?\]/g, '').trim();

          return (
            <View className="flex-col">
              <View className="bg-emerald-50 border border-emerald-200 rounded-xl p-2 w-[220px] shadow-sm mb-1">
                <View className="flex-row items-center mb-2">
                  <View className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 mr-2">
                    <Image source={{ uri: p_image }} className="w-full h-full" resizeMode="cover" />
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className="text-[9px] font-semibold text-emerald-800 uppercase mb-0.5">
                      {isAdmin ? "Rekomendasi CS 🛒" : "Produk Pilihan 🛍️"}
                    </Text>
                    <Text className="text-[11px] font-bold text-gray-800" numberOfLines={1}>
                      {p_name}
                    </Text>
                    <Text className="text-xs font-bold text-red-600 mt-0.5">
                      {toRupiah(p_price)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigation.navigate('/p/:id', { id: p_id })}
                  className="bg-green-700 rounded-lg py-1.5 flex-row items-center justify-center shadow-sm"
                  activeOpacity={0.8}
                >
                  <Text className="text-white text-[10px] font-bold mr-1">Lihat Detail Produk</Text>
                  <Ionicons name="chevron-forward" size={12} color="white" />
                </TouchableOpacity>
              </View>
              {cleanMsg ? (
                <Text className={`text-xs mt-1 ${isAdmin ? "text-gray-800" : "text-white"}`}>
                  {cleanMsg}
                </Text>
              ) : null}
            </View>
          );
        }
      } catch (e) {
        console.error("Error parsing product embed:", e);
      }
    }
    return <Text className={`text-xs leading-5 ${isAdmin ? "text-gray-800" : "text-white"}`}>{content}</Text>;
  };

  const renderItem = ({ item }) => {
    const isAdmin = item.is_reply || Boolean(item.reply);
    const content = isAdmin ? item.reply : item.message;
    if (!content) return null;

    const timeStr = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "";

    return (
      <View className={`mb-3.5 flex-row ${isAdmin ? "justify-start" : "justify-end"}`}>
        <View className="flex-row items-end max-w-[85%]">
          {isAdmin && (
            <View className="w-6 h-6 rounded-full bg-green-700 mr-1.5 items-center justify-center">
              <Text className="text-[9px] font-bold text-white">CS</Text>
            </View>
          )}

          <View 
            className={`rounded-2xl px-3.5 py-2.5 shadow-sm ${
              isAdmin 
                ? "bg-white border border-gray-100 rounded-bl-sm" 
                : "bg-green-700 rounded-br-sm"
            }`}
          >
            {renderMessageContent(content, isAdmin)}
            
            {/* Attachment */}
            {item.image && typeof item.image === 'string' && item.image.startsWith('[') && (
              <View className="mt-2">
                {JSON.parse(item.image).map((imgUrl, idx) => {
                  const fullImgUrl = imgUrl.startsWith("http")
                    ? imgUrl
                    : `${base_url}/storage/conversation/${imgUrl}`;
                  return (
                    <Image
                      key={idx}
                      source={{ uri: fullImgUrl }}
                      className="w-48 h-32 rounded-lg mb-1"
                      resizeMode="cover"
                    />
                  );
                })}
              </View>
            )}

            <Text 
              className={`text-[9px] font-medium mt-1 text-right ${
                isAdmin ? "text-gray-400" : "text-green-200"
              }`}
            >
              {timeStr} {isAdmin && "• CS Toru"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    
    // In inverted FlatList, offsetY = 0 is the physical bottom.
    // As you scroll up to see older messages, offsetY increases.
    if (offsetY > 100) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
      if (setGlobalUnreadCount) setGlobalUnreadCount(0);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fa]">
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="bg-white border-b border-gray-100 px-4 py-3 flex-row items-center z-10 shadow-sm">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-8 h-8 rounded-full items-center justify-center mr-2"
          >
            <Ionicons name="chevron-back" size={24} color="#4b5563" />
          </TouchableOpacity>

          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-10 h-10 rounded-full bg-green-600 items-center justify-center shadow-sm">
                <Ionicons name="headset" size={20} color="white" />
              </View>
              <View className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
            </View>
            <View className="ml-3">
              <Text className="text-sm font-bold text-gray-800">Customer Service</Text>
              <View className="flex-row items-center mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                <Text className="text-[10px] text-emerald-600 font-medium">Online • Siap Membantu</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chat Area */}
        <View className="flex-1 relative">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#15803d" />
            </View>
          ) : messages.length === 0 ? (
            <View className="flex-1 items-center justify-center px-8">
              <View className="w-16 h-16 rounded-full bg-green-50 items-center justify-center mb-3">
                <Ionicons name="chatbubbles" size={30} color="#15803d" />
              </View>
              <Text className="text-sm font-bold text-gray-800 mb-1 text-center">Halo! Ada yang bisa kami bantu?</Text>
              <Text className="text-[11px] text-gray-400 text-center">
                Kirimkan pertanyaan atau kendala pesanan Anda. Tim CS kami akan merespon pesan Anda.
              </Text>
            </View>
          ) : (
              <FlatList
              ref={flatListRef}
              data={[...messages].reverse()}
              inverted={true}
              keyExtractor={(item, index) => (item.id || index).toString()}
              renderItem={renderItem}
              contentContainerStyle={{ padding: 16, paddingTop: 65, paddingBottom: 20 }}
              onScroll={handleScroll}
            />
          )}

          {/* Floating Scroll Button */}
          {showScrollBottomBtn && (
            <TouchableOpacity 
              onPress={scrollToBottom}
              className="absolute bottom-4 right-4 bg-green-700 w-10 h-10 rounded-full items-center justify-center shadow-lg"
              activeOpacity={0.8}
            >
              <Ionicons name="chevron-down" size={20} color="white" />
              {globalUnreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-2 border-white">
                  <Text className="text-white text-[9px] font-bold">{globalUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Input Bar */}
        <View className="bg-white border-t border-gray-100 p-3 pb-[33px]">
          {productEmbed ? (
            <View className="mb-2 bg-emerald-50 border border-emerald-100 p-2 rounded-lg flex-row justify-between items-center">
              <Text className="text-[10px] text-emerald-800 flex-1" numberOfLines={1}>
                Tanya produk: <Text className="font-bold">{decodeURIComponent(productEmbed.match(/\|name=(.*?)\|/)?.[1] || "Produk")}</Text>
              </Text>
              <TouchableOpacity onPress={() => setProductEmbed("")} className="ml-2 p-1">
                <Ionicons name="close" size={14} color="#6b7280" />
              </TouchableOpacity>
            </View>
          ) : null}
          
          <View className="flex-row items-center">
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Tulis pesan untuk CS..."
              placeholderTextColor="#9ca3af"
              className="flex-1 bg-gray-100 text-gray-800 rounded-full px-4 py-2.5 text-xs mr-2"
              multiline={false}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity 
              onPress={handleSend}
              disabled={(!inputMessage.trim() && !productEmbed) || sending}
              className={`w-10 h-10 rounded-full items-center justify-center shadow-sm ${
                (inputMessage.trim() || productEmbed) && !sending
                  ? "bg-green-700"
                  : "bg-gray-300"
              }`}
            >
              <Ionicons name="send" size={16} color="white" style={{ marginLeft: 2 }} />
            </TouchableOpacity>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
