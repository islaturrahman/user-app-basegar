import React, { useContext, useRef, useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, StyleSheet,
  Dimensions, Animated
} from 'react-native';
import { LiveContext } from '../provider/LiveProvider';
import CartContext from '../../../context/CartContext';
import { BlankBottomSheet } from '../../../components/BlankBottomSheet';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = 110;

function ProductCard({ product, onBuy }) {
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onBuy(product)}
      style={styles.productCard}
    >
      {/* Emoji / thumbnail */}
      <View style={styles.productImgBox}>
        <Text style={styles.productEmoji}>{product.emoji}</Text>
        {hasDiscount && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercent}%</Text>
          </View>
        )}
      </View>

      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productUnit}>{product.unit}</Text>

      {hasDiscount && (
        <Text style={styles.originalPrice}>Rp {product.originalPrice.toLocaleString('id-ID')}</Text>
      )}
      <Text style={styles.productPrice}>Rp {product.price.toLocaleString('id-ID')}</Text>

      <TouchableOpacity onPress={() => onBuy(product)} style={styles.addBtn}>
        <Plus size={12} color="white" strokeWidth={3} />
        <Text style={styles.addBtnText}>Beli</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function LiveProductCarousel({ sessionId }) {
  const { sessions } = useContext(LiveContext);
  const { addToCart } = useContext(CartContext) || {};
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [addedId, setAddedId] = useState(null);

  const session = sessions.find(s => s.id === sessionId);
  const products = session?.products || [];

  const handleBuyPress = useCallback((product) => {
    setSelectedProduct(product);
    setQty(1);
    setNote('');
    setShowSheet(true);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct) return;
    if (addToCart) {
      addToCart(selectedProduct.id, selectedProduct.name, selectedProduct.price, qty, note, [], 0, null, null);
    }
    setAddedId(selectedProduct.id);
    setTimeout(() => setAddedId(null), 2000);
    setShowSheet(false);
  }, [selectedProduct, qty, note, addToCart]);

  if (products.length === 0) return null;

  const total = selectedProduct ? selectedProduct.price * qty : 0;

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>🛒 Produk di Live Ini</Text>
          <Text style={styles.headerCount}>{products.length} item</Text>
        </View>
        <FlatList
          horizontal
          data={products}
          keyExtractor={p => p.id.toString()}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
          renderItem={({ item }) => (
            <View style={{ position: 'relative' }}>
              <ProductCard product={item} onBuy={handleBuyPress} />
              {addedId === item.id && (
                <View style={styles.addedOverlay}>
                  <Text style={styles.addedText}>✓ Ditambahkan!</Text>
                </View>
              )}
            </View>
          )}
        />
      </View>

      {/* Bottom Sheet: Add to Cart */}
      <BlankBottomSheet isOpen={showSheet} onClose={() => setShowSheet(false)}>
        {selectedProduct && (
          <View style={styles.sheetContent}>
            {/* Handle bar */}
            <View style={styles.handleBar} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetEmojiBox}>
                <Text style={{ fontSize: 32 }}>{selectedProduct.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetProductName}>{selectedProduct.name}</Text>
                <Text style={styles.sheetUnit}>{selectedProduct.unit}</Text>
                {selectedProduct.originalPrice && (
                  <Text style={styles.sheetOriginalPrice}>
                    Rp {selectedProduct.originalPrice.toLocaleString('id-ID')}
                  </Text>
                )}
                <Text style={styles.sheetPrice}>Rp {selectedProduct.price.toLocaleString('id-ID')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSheet(false)} style={styles.closeBtn}>
                <X size={16} color="#6b7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {/* Stok */}
            {selectedProduct.stock <= 10 && (
              <View style={styles.stockWarning}>
                <Text style={styles.stockWarningText}>⚠️ Stok terbatas: {selectedProduct.stock} tersisa</Text>
              </View>
            )}

            {/* Pilih Jumlah */}
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>Jumlah</Text>
              <View style={styles.qtyControl}>
                <TouchableOpacity
                  onPress={() => setQty(q => Math.max(1, q - 1))}
                  style={[styles.qtyBtn, qty <= 1 && styles.qtyBtnDisabled]}
                  disabled={qty <= 1}
                >
                  <Minus size={14} color={qty <= 1 ? '#d1d5db' : '#15803d'} strokeWidth={2.5} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  onPress={() => setQty(q => Math.min(selectedProduct.stock, q + 1))}
                  style={styles.qtyBtn}
                >
                  <Plus size={14} color="#15803d" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total & CTA */}
            <View style={styles.totalRow}>
              <View>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalPrice}>Rp {total.toLocaleString('id-ID')}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
              <ShoppingCart size={16} color="white" strokeWidth={2} />
              <Text style={styles.addCartBtnText}>Tambah ke Keranjang</Text>
            </TouchableOpacity>

            <Text style={styles.continueHint}>✅ Setelah ini Anda bisa lanjut nonton</Text>
          </View>
        )}
      </BlankBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, marginBottom: 8 },
  headerLabel: { color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 12 },
  headerCount: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_400Regular', fontSize: 11 },
  productCard: {
    width: CARD_W,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    padding: 8,
    gap: 3,
  },
  productImgBox: {
    width: '100%',
    height: 72,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  productEmoji: { fontSize: 36 },
  discountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  discountText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 8 },
  productName: { fontFamily: 'Poppins_600SemiBold', fontSize: 10, color: '#1f2937', lineHeight: 14 },
  productUnit: { fontFamily: 'Poppins_400Regular', fontSize: 9, color: '#9ca3af' },
  originalPrice: { fontFamily: 'Poppins_400Regular', fontSize: 9, color: '#9ca3af', textDecorationLine: 'line-through' },
  productPrice: { fontFamily: 'Poppins_700Bold', fontSize: 11, color: '#15803d' },
  addBtn: {
    flexDirection: 'row',
    backgroundColor: '#15803d',
    borderRadius: 6,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    marginTop: 2,
  },
  addBtnText: { color: 'white', fontFamily: 'Poppins_600SemiBold', fontSize: 10 },
  addedOverlay: {
    position: 'absolute', inset: 0,
    backgroundColor: 'rgba(21,128,61,0.88)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addedText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  // Sheet
  sheetContent: { padding: 16, paddingBottom: 8 },
  handleBar: { width: 36, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  sheetEmojiBox: { width: 64, height: 64, backgroundColor: '#f0fdf4', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  sheetProductName: { fontFamily: 'Poppins_700Bold', fontSize: 15, color: '#1f2937' },
  sheetUnit: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#6b7280', marginTop: 2 },
  sheetOriginalPrice: { fontFamily: 'Poppins_400Regular', fontSize: 12, color: '#9ca3af', textDecorationLine: 'line-through', marginTop: 4 },
  sheetPrice: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#15803d', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  stockWarning: { backgroundColor: '#fef3c7', borderRadius: 8, padding: 8, marginBottom: 12 },
  stockWarningText: { fontFamily: 'Poppins_500Medium', fontSize: 12, color: '#92400e' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  qtyLabel: { fontFamily: 'Poppins_500Medium', fontSize: 14, color: '#374151' },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center', justifyContent: 'center' },
  qtyBtnDisabled: { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' },
  qtyValue: { fontFamily: 'Poppins_700Bold', fontSize: 18, color: '#1f2937', minWidth: 28, textAlign: 'center' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  totalLabel: { fontFamily: 'Poppins_400Regular', fontSize: 13, color: '#6b7280' },
  totalPrice: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#15803d' },
  addCartBtn: {
    backgroundColor: '#15803d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#15803d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addCartBtnText: { color: 'white', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  continueHint: { textAlign: 'center', color: '#9ca3af', fontFamily: 'Poppins_400Regular', fontSize: 11, marginBottom: 4 },
});
