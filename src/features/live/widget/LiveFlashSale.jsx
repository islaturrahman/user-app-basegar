import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Zap, ShoppingCart } from 'lucide-react-native';

function CountdownDisplay({ ms }) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');

  return (
    <View style={styles.countdownRow}>
      {h > 0 && (
        <>
          <View style={styles.digitBox}>
            <Text style={styles.digit}>{pad(h)}</Text>
          </View>
          <Text style={styles.colon}>:</Text>
        </>
      )}
      <View style={styles.digitBox}>
        <Text style={styles.digit}>{pad(m)}</Text>
      </View>
      <Text style={styles.colon}>:</Text>
      <View style={[styles.digitBox, s <= 10 && styles.digitBoxUrgent]}>
        <Text style={[styles.digit, s <= 10 && styles.digitUrgent]}>{pad(s)}</Text>
      </View>
    </View>
  );
}

export default function LiveFlashSale({ flashSale, onClaim }) {
  const [msLeft, setMsLeft] = useState(0);
  const [expired, setExpired] = useState(false);
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!flashSale?.active || !flashSale?.endsAt) return;

    const calcMs = () => {
      const diff = new Date(flashSale.endsAt).getTime() - Date.now();
      return Math.max(0, diff);
    };

    setMsLeft(calcMs());
    setExpired(calcMs() <= 0);

    intervalRef.current = setInterval(() => {
      const ms = calcMs();
      setMsLeft(ms);
      if (ms <= 0) {
        setExpired(true);
        clearInterval(intervalRef.current);
      }
    }, 1000);

    // Slide in animation
    Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }).start();

    // Shake animation setiap 10 detik
    const shakeLoop = setInterval(() => {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, 10000);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(shakeLoop);
    };
  }, [flashSale]);

  if (!flashSale?.active) return null;

  const discountPct = Math.round((1 - flashSale.salePrice / flashSale.originalPrice) * 100);
  const stockPct = Math.round((flashSale.soldCount / flashSale.totalStock) * 100);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }, { translateX: shakeAnim }] }]}>
      {/* Top Label */}
      <View style={styles.topBar}>
        <Zap size={13} color="#fbbf24" fill="#fbbf24" />
        <Text style={styles.topLabel}>FLASH SALE — WAKTU TERSISA!</Text>
        <Zap size={13} color="#fbbf24" fill="#fbbf24" />
      </View>

      <View style={styles.body}>
        {/* Countdown */}
        {!expired ? (
          <CountdownDisplay ms={msLeft} />
        ) : (
          <View style={styles.expiredBox}>
            <Text style={styles.expiredText}>Flash Sale Berakhir</Text>
          </View>
        )}

        {/* Product info */}
        <View style={styles.productRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.flashProductName} numberOfLines={1}>{flashSale.productName}</Text>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>Rp {flashSale.salePrice.toLocaleString('id-ID')}</Text>
              <Text style={styles.origPrice}>Rp {flashSale.originalPrice.toLocaleString('id-ID')}</Text>
              <View style={styles.pctBadge}>
                <Text style={styles.pctText}>-{discountPct}%</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          {!expired && (
            <TouchableOpacity style={styles.claimBtn} onPress={onClaim} activeOpacity={0.85}>
              <ShoppingCart size={13} color="white" strokeWidth={2.5} />
              <Text style={styles.claimBtnText}>Klaim!</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stock bar */}
        <View style={styles.stockSection}>
          <View style={styles.stockBar}>
            <Animated.View style={[styles.stockFill, { width: `${stockPct}%` }]} />
          </View>
          <Text style={styles.stockText}>{flashSale.soldCount}/{flashSale.totalStock} terjual</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1c1917',
    borderWidth: 1,
    borderColor: '#f59e0b',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  topBar: {
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 6,
  },
  topLabel: {
    color: 'white',
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 1,
  },
  body: { padding: 10, gap: 8 },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  digitBox: {
    backgroundColor: '#292524',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#44403c',
  },
  digitBoxUrgent: {
    backgroundColor: '#7f1d1d',
    borderColor: '#ef4444',
  },
  digit: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 18 },
  digitUrgent: { color: '#fca5a5' },
  colon: { color: '#f59e0b', fontFamily: 'Poppins_700Bold', fontSize: 20 },
  expiredBox: { alignItems: 'center' },
  expiredText: { color: '#9ca3af', fontFamily: 'Poppins_600SemiBold', fontSize: 13 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flashProductName: { color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  salePrice: { color: '#fbbf24', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  origPrice: { color: '#78716c', fontFamily: 'Poppins_400Regular', fontSize: 11, textDecorationLine: 'line-through' },
  pctBadge: { backgroundColor: '#ef4444', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  pctText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 9 },
  claimBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  claimBtnText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  stockSection: { gap: 4 },
  stockBar: { height: 5, backgroundColor: '#44403c', borderRadius: 3, overflow: 'hidden' },
  stockFill: { height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 },
  stockText: { color: '#78716c', fontFamily: 'Poppins_400Regular', fontSize: 10, textAlign: 'right' },
});
