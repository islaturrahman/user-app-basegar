import React, { useState, useContext, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  TextInput, 
  RefreshControl, 
  Platform, 
  StatusBar,
  ActivityIndicator,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { get } from '../../../data/api';
import ChatContext from '../../../context/ChatContext';

const toRupiah = (price) => `Rp ${(Number(price) || 0).toLocaleString('id-ID')}`;

export default function ChatListView() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'runner' | 'cs'
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Chat Context for CS Unread & Messages
  const chatCtx = useContext(ChatContext);
  const globalUnreadCount = chatCtx?.globalUnreadCount || 0;
  const rawMessages = chatCtx?.messages || [];
  const csMessages = rawMessages.filter(m => {
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
    if (m.target === 'cs' || m.target === 'admin' || m.chat_type === 'cs' || m.chat_type === 'admin') return true;
    return !m.order_id;
  });
  const lastCsMsg = csMessages.length > 0 ? csMessages[csMessages.length - 1] : null;
  const lastCsMsgText = lastCsMsg ? (lastCsMsg.reply || lastCsMsg.message || 'Tim CS Siap Membantu') : 'Tim CS Siap Membantu 24/7 🎧';

  const formatDateStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchActiveOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await get('/api/v1/customer/order/list');
      const rawList = Array.isArray(res) ? res : (res && Array.isArray(res.orders) ? res.orders : []);
      
      const todayStr = formatDateStr(new Date());
      const tomorrowDate = new Date();
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = formatDateStr(tomorrowDate);

      const active = rawList.filter(o => {
        const isActiveStatus = ['confirmed', 'processing', 'packaging', 'out_for_delivery', 'shopping', 'accepted', 'pending'].includes(o.order_status);
        if (!isActiveStatus) return false;

        // Filter to orders for Today and Tomorrow only
        const orderDateStr = (o.delivery_date || o.created_at || '').substring(0, 10);
        if (!orderDateStr) return true;

        return orderDateStr === todayStr || orderDateStr === tomorrowStr;
      });

      setOrders(active);
    } catch (e) {
      console.log('Error fetching user active orders for chat list:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchActiveOrders();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchActiveOrders();
    if (chatCtx?.fetchMessages) {
      await chatCtx.fetchMessages(false);
    }
    setRefreshing(false);
  }, [chatCtx]);

  // Format order runner chat items
  const runnerChats = orders.map((order) => {
    const runnerName = order.delivery_man 
      ? `${order.delivery_man.f_name || ''} ${order.delivery_man.l_name || ''}`.trim() 
      : 'Mitra Runner Basegar';
    const runnerPhone = order.delivery_man?.phone || '';
    const orderId = order.id;
    const orderStatus = order.order_status;

    let statusLabel = 'Dikonfirmasi';
    if (orderStatus === 'shopping' || orderStatus === 'processing') statusLabel = '🛒 Belanja';
    else if (orderStatus === 'out_for_delivery') statusLabel = '🛵 Pengiriman';
    else if (orderStatus === 'packaging') statusLabel = '📦 Packaging';
    else if (orderStatus === 'pending') statusLabel = '⏳ Menunggu';

    return {
      id: `order-${orderId}`,
      orderId,
      runnerName,
      runnerPhone,
      orderStatus,
      statusLabel,
      amount: order.order_amount || 0,
      lastMessage: "Klik untuk koordinasi belanja & pengiriman...",
      time: order.created_at ? new Date(order.created_at.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Aktif',
      type: 'runner'
    };
  });

  // Filter based on searchQuery and activeTab
  const filteredRunnerChats = runnerChats.filter(chat => {
    const matchesSearch = chat.runnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          chat.orderId.toString().includes(searchQuery);
    if (activeTab === 'cs') return false;
    return matchesSearch;
  });

  const showCsCard = activeTab === 'all' || activeTab === 'cs';

  return (
    <SafeAreaView className="flex-1 bg-[#f7f9fa]">
      {/* Header */}
      <View 
        className="bg-emerald-800 px-4 pb-4 rounded-b-[20px] z-10 shadow-sm"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }}
      >
        <Text className="text-[18px] font-bold text-white mb-0.5">Pesan & Chat</Text>
        <Text className="text-[11.5px] text-emerald-100/80">Komunikasi dengan CS Support & Runner Belanja</Text>

        {/* Search Bar */}
        <View className="mt-3 bg-white/15 rounded-xl px-3 py-2 flex-row items-center">
          <Ionicons name="search" size={16} color="#ffffff" style={{ opacity: 0.8 }} />
          <TextInput 
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Cari nama runner atau ID order..."
            placeholderTextColor="rgba(255, 255, 255, 0.65)"
            className="flex-1 ml-2 text-white text-xs font-medium"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#ffffff" style={{ opacity: 0.8 }} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Chips */}
      <View className="flex-row px-4 pt-3 pb-1 space-x-2">
        <TouchableOpacity 
          onPress={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-full border ${activeTab === 'all' ? 'bg-emerald-800 border-emerald-800' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-[11px] font-bold ${activeTab === 'all' ? 'text-white' : 'text-gray-600'}`}>
            Semua Chat
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('runner')}
          className={`px-3.5 py-1.5 rounded-full border ${activeTab === 'runner' ? 'bg-emerald-800 border-emerald-800' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-[11px] font-bold ${activeTab === 'runner' ? 'text-white' : 'text-gray-600'}`}>
            Runner Belanja ({runnerChats.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setActiveTab('cs')}
          className={`px-3.5 py-1.5 rounded-full border ${activeTab === 'cs' ? 'bg-emerald-800 border-emerald-800' : 'bg-white border-gray-200'}`}
        >
          <Text className={`text-[11px] font-bold ${activeTab === 'cs' ? 'text-white' : 'text-gray-600'}`}>
            Bantuan CS {globalUnreadCount > 0 ? `(${globalUnreadCount})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-4 pt-2"
        contentContainerStyle={{ paddingBottom: 110 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#065f46']}
            tintColor="#065f46"
          />
        }
      >
        {/* Pinned CS Card */}
        {showCsCard && (
          <TouchableOpacity
            onPress={() => navigation.navigate('/cs')}
            className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-3.5 mb-3 flex-row items-center shadow-sm"
            activeOpacity={0.85}
          >
            <View className="relative">
              <View className="w-12 h-12 rounded-full bg-emerald-700 items-center justify-center shadow-sm">
                <FontAwesome5 name="headset" size={20} color="white" />
              </View>
              <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
            </View>

            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center space-x-1">
                  <Text className="text-[13px] font-bold text-gray-900">Customer Service Basegar</Text>
                  <View className="bg-emerald-200/60 px-1.5 py-0.5 rounded ml-1">
                    <Text className="text-[9px] font-bold text-emerald-800 uppercase">Bantuan CS</Text>
                  </View>
                </View>
                <Text className="text-[10px] font-medium text-emerald-700">Online</Text>
              </View>

              <Text className="text-[11.5px] text-gray-600 mt-1" numberOfLines={1}>
                {lastCsMsgText}
              </Text>
            </View>

            {globalUnreadCount > 0 && (
              <View className="ml-2 bg-red-500 min-w-[20px] h-[20px] rounded-full items-center justify-center px-1">
                <Text className="text-white text-[10px] font-bold">{globalUnreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Runner Chats Section Title */}
        {activeTab !== 'cs' && (
          <Text className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 mt-1">
            Chat Runner Pesanan Aktif 🛵
          </Text>
        )}

        {/* Runner Order Cards List */}
        {activeTab !== 'cs' && filteredRunnerChats.length === 0 ? (
          <View className="bg-white rounded-[14px] p-6 border border-gray-200 items-center my-2 shadow-sm">
            <FontAwesome5 name="motorcycle" size={28} color="#9ca3af" />
            <Text className="text-[12.5px] font-bold text-gray-800 mt-2.5">Belum Ada Chat Runner</Text>
            <Text className="text-[11px] text-gray-500 text-center mt-1 leading-4">
              Chat dengan Runner akan otomatis tersedia saat Anda memiliki pesanan yang dikonfirmasi / sedang diproses.
            </Text>
          </View>
        ) : (
          filteredRunnerChats.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate('/order-chat', {
                orderId: item.orderId,
                status: item.statusLabel,
                amount: item.amount,
                runnerName: item.runnerName,
                runnerPhone: item.runnerPhone
              })}
              className="bg-white border border-gray-200 rounded-[14px] p-3.5 mb-2.5 flex-row items-center shadow-sm"
              activeOpacity={0.85}
            >
              {/* Runner Avatar Icon */}
              <View className="w-11 h-11 rounded-full bg-emerald-100 border border-emerald-300 items-center justify-center mr-3">
                <FontAwesome5 name="motorcycle" size={16} color="#047857" />
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-0.5">
                  <Text className="text-[13px] font-bold text-gray-900" numberOfLines={1}>
                    {item.runnerName}
                  </Text>
                  <Text className="text-[10px] text-gray-400">{item.time}</Text>
                </View>

                <View className="flex-row items-center mb-1 space-x-1.5">
                  <View className="bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200">
                    <Text className="text-[9.5px] font-bold text-emerald-800">Order #{item.orderId}</Text>
                  </View>

                  <View className="bg-amber-100 px-1.5 py-0.5 rounded ml-1">
                    <Text className="text-[9.5px] font-bold text-amber-800 capitalize">
                      {item.statusLabel}
                    </Text>
                  </View>
                </View>

                <Text className="text-[11px] text-gray-500" numberOfLines={1}>
                  {item.lastMessage}
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={16} color="#9ca3af" className="ml-2" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
