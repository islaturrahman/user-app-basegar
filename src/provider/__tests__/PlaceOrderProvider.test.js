import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderPlaceProvider, { OrderPlaceContext } from '../PlaceOrderProvider';
import * as api from '../../data/api';

// ── Mock Modules ─────────────────────────────────────────────────────────────

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome5: 'FontAwesome5',
}));

jest.mock('expo-image', () => ({ Image: 'Image' }));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
}));

jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Mock BackHandler (Android)
jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  removeEventListener: jest.fn(),
}));

// Mock Animated untuk menghindari lingkungan native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Animated.timing = () => ({
    start: (cb) => cb && cb(),
  });
  RN.Animated.parallel = (anims) => ({
    start: (cb) => {
      anims.forEach(a => a.start && a.start());
      if (cb) cb();
    },
  });
  return RN;
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const createTestQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

/**
 * Isi AsyncStorage dengan data lengkap untuk simulasi checkout yang valid
 */
const setupValidCheckoutData = async ({
  paymentMethod = 'cash_on_delivery',
  isPartial = false,
  walletBalance = 0,
} = {}) => {
  const cart = JSON.stringify([{ product_id: 1, name: 'Produk A', price: 10000, quantity: 2 }]);
  const address = JSON.stringify({
    id: 5,
    contact_person_name: 'Budi',
    contact_person_number: '+628123456789',
    user_id: 99,
  });

  await AsyncStorage.setItem('cart', cart);
  await AsyncStorage.setItem('selectAddress', address);
  await AsyncStorage.setItem('dateslot', '2024-12-31');
  await AsyncStorage.setItem('timeslotId', '2');
  await AsyncStorage.setItem('order_amount', '25000');
  await AsyncStorage.setItem('distance', '3.5');
  await AsyncStorage.setItem('payment_method', paymentMethod);
  if (isPartial) await AsyncStorage.setItem('is_partial', '1');
  if (walletBalance > 0) {
    await AsyncStorage.setItem('user', JSON.stringify({ wallet_balance: walletBalance }));
  }
};

// ── Test Helper: Render Provider & capture context ─────────────────────────────

const renderProvider = () => {
  let contextValue = null;
  const TestConsumer = () => {
    contextValue = React.useContext(OrderPlaceContext);
    return null;
  };

  let root;
  TestRenderer.act(() => {
    root = TestRenderer.create(
      <QueryClientProvider client={createTestQueryClient()}>
        <OrderPlaceProvider>
          <TestConsumer />
        </OrderPlaceProvider>
      </QueryClientProvider>
    );
  });

  const getContext = () => contextValue;
  return { root, getContext };
};

// ── Test Suites ───────────────────────────────────────────────────────────────

describe('PlaceOrderProvider — validasi checkout', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('harus gagal validasi jika keranjang kosong', async () => {
    // Tidak ada data sama sekali di AsyncStorage
    const { getContext } = renderProvider();

    const mockNav = { navigate: jest.fn() };
    await act(async () => {
      await getContext().placeOrder(mockNav, jest.fn());
    });

    expect(getContext().success).toMatchObject({
      status: false,
      message: 'Keranjang belanja masih kosong',
    });
  });

  it('harus gagal validasi jika alamat tidak dipilih', async () => {
    await AsyncStorage.setItem('cart', '[{"id":1}]');
    // Tidak set selectAddress

    const { getContext } = renderProvider();
    const mockNav = { navigate: jest.fn() };
    await act(async () => {
      await getContext().placeOrder(mockNav, jest.fn());
    });

    expect(getContext().success).toMatchObject({
      status: false,
      message: 'Silakan pilih alamat pengiriman',
    });
  });

  it('harus gagal validasi jika nama penerima kosong', async () => {
    await AsyncStorage.setItem('cart', '[{"id":1}]');
    await AsyncStorage.setItem('selectAddress', JSON.stringify({
      id: 5,
      contact_person_name: '',
      contact_person_number: '+628123456789',
    }));

    const { getContext } = renderProvider();
    const mockNav = { navigate: jest.fn() };
    await act(async () => {
      await getContext().placeOrder(mockNav, jest.fn());
    });

    expect(getContext().success).toMatchObject({
      status: false,
      message: 'Silakan lengkapi Nama Penerima di Data Penerima',
    });
  });

  it('harus gagal validasi jika tanggal pengiriman belum dipilih', async () => {
    await AsyncStorage.setItem('cart', '[{"id":1}]');
    await AsyncStorage.setItem('selectAddress', JSON.stringify({
      id: 5,
      contact_person_name: 'Budi',
      contact_person_number: '+62812',
    }));
    // Tidak set dateslot

    const { getContext } = renderProvider();
    const mockNav = { navigate: jest.fn() };
    await act(async () => {
      await getContext().placeOrder(mockNav, jest.fn());
    });

    expect(getContext().success).toMatchObject({
      status: false,
      message: 'Silakan pilih tanggal pengiriman',
    });
  });

  it('harus gagal validasi jika metode pembayaran belum dipilih', async () => {
    await AsyncStorage.setItem('cart', '[{"id":1}]');
    await AsyncStorage.setItem('selectAddress', JSON.stringify({
      id: 5,
      contact_person_name: 'Budi',
      contact_person_number: '+62812',
    }));
    await AsyncStorage.setItem('dateslot', '2024-12-31');
    await AsyncStorage.setItem('timeslotId', '1');
    await AsyncStorage.setItem('order_amount', '25000');
    await AsyncStorage.setItem('distance', '3');
    // Tidak set payment_method

    const { getContext } = renderProvider();
    const mockNav = { navigate: jest.fn() };
    await act(async () => {
      await getContext().placeOrder(mockNav, jest.fn());
    });

    expect(getContext().success).toMatchObject({
      status: false,
      message: 'Silakan pilih metode pembayaran',
    });
  });
});

describe('PlaceOrderProvider — logika placeOrder', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it('harus navigate ke halaman sukses setelah COD berhasil', async () => {
    await setupValidCheckoutData({ paymentMethod: 'cash_on_delivery' });

    jest.spyOn(api, 'post').mockResolvedValueOnce({ order_id: 42 });

    const { getContext } = renderProvider();
    const mockNavigate = jest.fn();
    const mockClearCart = jest.fn();

    await act(async () => {
      await getContext().placeOrder({ navigate: mockNavigate }, mockClearCart);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/o/:id/success', expect.objectContaining({
      order_id: 42,
      is_error: false,
      payment_method: 'cash_on_delivery',
    }));
    expect(mockClearCart).toHaveBeenCalled();
  });

  it('harus kalkulasi gateway_amount setelah dikurangi saldo dompet (partial)', async () => {
    // order_amount = 25000, wallet = 10000, maka gateway_amount = 15000
    await setupValidCheckoutData({
      paymentMethod: 'cash_on_delivery',
      isPartial: true,
      walletBalance: 10000,
    });

    let capturedBody = null;
    jest.spyOn(api, 'post').mockImplementationOnce(async (url, body) => {
      capturedBody = body;
      return { order_id: 99 };
    });

    const { getContext } = renderProvider();
    const mockNavigate = jest.fn();

    await act(async () => {
      await getContext().placeOrder({ navigate: mockNavigate }, jest.fn());
    });

    // Verifikasi bahwa order dikirim dengan order_amount penuh
    expect(capturedBody.order_amount).toBe(25000);
    // Verifikasi is_partial dikirim
    expect(capturedBody.is_partial).toBe('1');
    // Navigasi tetap ke sukses
    expect(mockNavigate).toHaveBeenCalledWith('/o/:id/success', expect.objectContaining({
      is_partial: true,
      wallet_balance: 10000,
    }));
  });

  it('harus navigate ke error jika server mengembalikan kesalahan', async () => {
    await setupValidCheckoutData({ paymentMethod: 'cash_on_delivery' });

    jest.spyOn(api, 'post').mockResolvedValueOnce({
      message: 'Stok produk habis',
    });

    const { getContext } = renderProvider();
    const mockNavigate = jest.fn();

    await act(async () => {
      await getContext().placeOrder({ navigate: mockNavigate }, jest.fn());
    });

    expect(mockNavigate).toHaveBeenCalledWith('/o/:id/success', expect.objectContaining({
      is_error: true,
      error_message: 'Stok produk habis',
    }));
  });

  it('harus membersihkan AsyncStorage setelah order COD berhasil', async () => {
    await setupValidCheckoutData({ paymentMethod: 'cash_on_delivery' });

    jest.spyOn(api, 'post').mockResolvedValueOnce({ order_id: 55 });

    const { getContext } = renderProvider();
    await act(async () => {
      await getContext().placeOrder({ navigate: jest.fn() }, jest.fn());
    });

    // Keys yang seharusnya dihapus setelah order berhasil
    const keysToRemove = ['dateslot', 'timeslotId', 'order_amount', 'distance', 'payment_method'];
    for (const key of keysToRemove) {
      const value = await AsyncStorage.getItem(key);
      expect(value).toBeNull();
    }
  });
});
