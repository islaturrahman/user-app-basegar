import React, { useContext, useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Animated,
  Platform, Dimensions, StyleSheet, Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LiveContext } from '../provider/LiveProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animasi pulse merah untuk indikator LIVE
function LivePulseDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#fca5a5', opacity: 0.5, transform: [{ scale: pulseAnim }] }} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#ef4444' }} />
    </View>
  );
}

export default function LiveBanner() {
  const navigation = useNavigation();
  const { sessions } = useContext(LiveContext);
  const liveSessions = sessions.filter(s => s.status === 'live');
  const slideAnim = useRef(new Animated.Value(20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  if (liveSessions.length === 0) return null;

  const mainSession = liveSessions[0];

  const CARD_WIDTH = Math.min(SCREEN_WIDTH - 32, 568);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginHorizontal: 16, marginBottom: 12 }}>
      {/* Header Label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 6 }}>
        <LivePulseDot />
        <Text style={{ fontSize: 11, fontFamily: 'Poppins_700Bold', color: '#ef4444', letterSpacing: 1, textTransform: 'uppercase' }}>
          Sedang Live Sekarang
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={() => navigation.navigate('/live')}>
          <Text style={{ fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#15803d' }}>Lihat Semua →</Text>
        </TouchableOpacity>
      </View>

      {/* Main Live Card */}
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => navigation.navigate('/live/:id', { id: mainSession.id })}
        style={[styles.mainCard, { backgroundColor: mainSession.thumbnailColor }]}
      >
        {/* Background gradient overlay */}
        <View style={styles.gradientOverlay} />

        {/* Emoji besar sebagai thumbnail placeholder */}
        <Text style={styles.bigEmoji}>{mainSession.emoji}</Text>

        {/* Top badges */}
        <View style={styles.topRow}>
          <View style={styles.liveBadge}>
            <LivePulseDot />
            <Text style={styles.liveBadgeText}>LIVE</Text>
          </View>
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerText}>👁 {mainSession.viewerCount.toLocaleString('id-ID')}</Text>
          </View>
        </View>

        {/* Bottom info */}
        <View style={styles.bottomInfo}>
          <View style={styles.hostBadge}>
            <Text style={styles.hostEmoji}>👤</Text>
            <Text style={styles.hostName}>{mainSession.host}</Text>
          </View>
          <Text style={styles.sessionTitle} numberOfLines={1}>{mainSession.title}</Text>
          <View style={styles.watchBtn}>
            <Text style={styles.watchBtnText}>▶ Tonton Sekarang</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Sesi live lain (jika ada) */}
      {liveSessions.length > 1 && (
        <FlatList
          horizontal
          data={liveSessions.slice(1)}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 8, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => navigation.navigate('/live/:id', { id: item.id })}
              style={[styles.smallCard, { backgroundColor: item.thumbnailColor }]}
            >
              <Text style={styles.smallEmoji}>{item.emoji}</Text>
              <View style={styles.smallLiveBadge}>
                <Text style={styles.smallLiveText}>🔴 LIVE</Text>
              </View>
              <Text style={styles.smallTitle} numberOfLines={2}>{item.title}</Text>
              <Text style={styles.smallViewer}>👁 {item.viewerCount}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bigEmoji: {
    position: 'absolute',
    top: '15%',
    right: 20,
    fontSize: 70,
    opacity: 0.4,
  },
  topRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  liveBadgeText: {
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  viewerBadge: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  viewerText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
  },
  bottomInfo: {
    padding: 12,
    gap: 4,
  },
  hostBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hostEmoji: { fontSize: 12 },
  hostName: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_500Medium',
    fontSize: 11,
  },
  sessionTitle: {
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  watchBtn: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  watchBtnText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },
  smallCard: {
    width: 130,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 8,
    justifyContent: 'flex-end',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  smallEmoji: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 36,
    opacity: 0.35,
  },
  smallLiveBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  smallLiveText: {
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    fontSize: 8,
  },
  smallTitle: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    marginBottom: 2,
  },
  smallViewer: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
  },
});
