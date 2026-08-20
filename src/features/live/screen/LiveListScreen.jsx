import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, ScrollView,
  StyleSheet, Platform, Animated, Dimensions, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LiveContext } from '../provider/LiveProvider';
import { Video, Radio, Calendar, Clock } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 568);

function LivePulseDot({ size = 8 }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.8, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: size + 4, height: size + 4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: size + 4, height: size + 4, borderRadius: (size + 4) / 2, backgroundColor: '#fca5a5', opacity: 0.5, transform: [{ scale: pulseAnim }] }} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#ef4444' }} />
    </View>
  );
}

function LiveSessionCard({ session, onPress }) {
  const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 60000);
  return (
    <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={[styles.sessionCard, { backgroundColor: session.thumbnailColor }]}>
      <View style={styles.cardOverlay} />

      {/* Emoji besar */}
      <Text style={styles.cardEmoji}>{session.emoji}</Text>

      {/* Badge atas */}
      <View style={styles.cardTopRow}>
        <View style={styles.liveBadge}>
          <LivePulseDot size={6} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <View style={styles.viewerBadge}>
          <Text style={styles.viewerText}>👁 {session.viewerCount.toLocaleString('id-ID')}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <View style={styles.timeBadge}>
          <Clock size={9} color="rgba(255,255,255,0.8)" strokeWidth={2} />
          <Text style={styles.timeText}>{elapsed}m</Text>
        </View>
      </View>

      {/* Info bawah */}
      <View style={styles.cardBottom}>
        <Text style={styles.hostText}>👤 {session.host}</Text>
        <Text style={styles.titleText} numberOfLines={2}>{session.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 }}>
          <View style={styles.watchBtn}>
            <Text style={styles.watchBtnText}>▶  Tonton</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 10, fontFamily: 'Poppins_400Regular' }}>
            {session.products.length} produk tersedia
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ScheduledCard({ item }) {
  return (
    <View style={styles.scheduledCard}>
      <View style={styles.scheduledEmoji}>
        <Text style={{ fontSize: 24 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.scheduledTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.scheduledHost}>{item.host}</Text>
      </View>
      <View style={styles.scheduledTime}>
        <Text style={styles.scheduledTimeText}>{item.scheduledAt}</Text>
        <Text style={styles.scheduledDate}>{item.date}</Text>
      </View>
    </View>
  );
}

export default function LiveListScreen() {
  const navigation = useNavigation();
  const { sessions, scheduled } = useContext(LiveContext);
  const [activeTab, setActiveTab] = useState('live');
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const liveSessions = sessions.filter(s => s.status === 'live');

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Radio size={18} color="white" strokeWidth={2} />
          <Text style={styles.headerTitle}>Basegar Live</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Tab: Sedang Live / Jadwal */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'live' && styles.tabActive]}
          onPress={() => setActiveTab('live')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            {activeTab === 'live' && <LivePulseDot size={6} />}
            <Text style={[styles.tabText, activeTab === 'live' && styles.tabTextActive]}>
              Sedang Live {liveSessions.length > 0 && `(${liveSessions.length})`}
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.tabActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Calendar size={12} color={activeTab === 'schedule' ? '#15803d' : '#9ca3af'} />
            <Text style={[styles.tabText, activeTab === 'schedule' && styles.tabTextActive]}>Jadwal</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: Platform.OS === 'android' ? 120 : 90, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#15803d" colors={['#15803d']} />}
      >
        {activeTab === 'live' ? (
          <Animated.View style={{ opacity: fadeAnim, gap: 12 }}>
            {liveSessions.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 48 }}>📡</Text>
                <Text style={styles.emptyTitle}>Belum Ada Live Sekarang</Text>
                <Text style={styles.emptySubtitle}>Cek jadwal untuk live berikutnya</Text>
                <TouchableOpacity style={styles.scheduleBtn} onPress={() => setActiveTab('schedule')}>
                  <Text style={styles.scheduleBtnText}>Lihat Jadwal →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              liveSessions.map(session => (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  onPress={() => navigation.navigate('/live/:id', { id: session.id })}
                />
              ))
            )}
          </Animated.View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, gap: 1, backgroundColor: 'white', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#f3f4f6' }}>
            {scheduled.map((item, i) => (
              <View key={item.id}>
                <ScheduledCard item={item} />
                {i < scheduled.length - 1 && <View style={{ height: 1, backgroundColor: '#f3f4f6', marginLeft: 72 }} />}
              </View>
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 44 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: 'white', fontSize: 18, fontFamily: 'Poppins_600SemiBold' },
  headerTitle: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 16 },
  tabRow: { flexDirection: 'row', backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#e5e7eb' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderColor: 'transparent' },
  tabActive: { borderBottomColor: '#15803d' },
  tabText: { fontFamily: 'Poppins_500Medium', fontSize: 13, color: '#9ca3af' },
  tabTextActive: { color: '#15803d', fontFamily: 'Poppins_600SemiBold' },
  sessionCard: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.38)' },
  cardEmoji: { position: 'absolute', top: '10%', right: 20, fontSize: 80, opacity: 0.35 },
  cardTopRow: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  liveBadgeText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 10, letterSpacing: 1 },
  viewerBadge: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  viewerText: { color: 'white', fontFamily: 'Poppins_500Medium', fontSize: 10 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 3 },
  timeText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_400Regular', fontSize: 9 },
  cardBottom: { padding: 14, gap: 3 },
  hostText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_400Regular', fontSize: 11 },
  titleText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  watchBtn: { alignSelf: 'flex-start', backgroundColor: 'white', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  watchBtnText: { color: '#15803d', fontFamily: 'Poppins_700Bold', fontSize: 11 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontFamily: 'Poppins_700Bold', fontSize: 16, color: '#374151', marginTop: 8 },
  emptySubtitle: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#9ca3af' },
  scheduleBtn: { marginTop: 8, backgroundColor: '#15803d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  scheduleBtnText: { color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  scheduledCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 14, gap: 12 },
  scheduledEmoji: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  scheduledTitle: { fontFamily: 'Poppins_600SemiBold', fontSize: 13, color: '#1f2937' },
  scheduledHost: { fontFamily: 'Poppins_400Regular', fontSize: 11, color: '#6b7280', marginTop: 2 },
  scheduledTime: { alignItems: 'flex-end' },
  scheduledTimeText: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#15803d' },
  scheduledDate: { fontFamily: 'Poppins_400Regular', fontSize: 10, color: '#9ca3af' },
});
