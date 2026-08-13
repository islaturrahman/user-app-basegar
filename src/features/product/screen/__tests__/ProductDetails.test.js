import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ProductDetails from '../ProductDetails';
import ProductsContext from '../../../../context/ProductsContext';
import CartContext from '../../../../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { toRupiah } from '../../../../components/Helper';
import { Animated } from 'react-native';

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: { id: 999 },
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  FontAwesome5: 'FontAwesome5',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

// Mock Animated to avoid timing issues in tests
jest.spyOn(Animated, 'timing').mockImplementation(() => ({
  start: (cb) => {
    if (cb) cb();
  }
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
      staleTime: 0,
    },
  },
});

describe('ProductDetails — Bug Harga Variasi', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  const renderProductDetails = async (productData) => {
    const queryClient = createTestQueryClient();
    const mockProductDetailsFn = jest.fn().mockResolvedValue(productData);

    let root;
    await act(async () => {
      root = TestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <CartContext.Provider value={{ cart: [], getCart: () => [], addToCart: jest.fn() }}>
            <ProductsContext.Provider value={{ productDetails: mockProductDetailsFn, fetchProducts: jest.fn().mockResolvedValue([]) }}>
              <ProductDetails />
            </ProductsContext.Provider>
          </CartContext.Provider>
        </QueryClientProvider>
      );
    });
    
    // Wait for queries to resolve and components to re-render
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    return root;
  };

  const findTextNodes = (root) => {
    const texts = [];
    const traverse = (node) => {
      if (typeof node === 'string') {
        texts.push(node);
      } else if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(root.toJSON());
    return texts;
  };

  it('harus menampilkan harga utama (main price) bila tidak ada variasi yang dipilih', async () => {
    const productWithVariations = {
      id: 999,
      name: 'Produk Bervariasi',
      price: 50000, 
      total_stock: 10,
      image: 'prod.jpg',
      variations: [
        { type: '100g', price: 15000 },
        { type: '200g', price: 28000 }
      ]
    };

    const root = await renderProductDetails(productWithVariations);
    
    const texts = findTextNodes(root);
    const expectedPriceStr = toRupiah(50000); 

    const priceFound = texts.some(t => t.includes(expectedPriceStr));
    expect(priceFound).toBe(true);

    const variationPriceFound = texts.some(t => t.includes(toRupiah(15000)));
    expect(variationPriceFound).toBe(false); // Should not fallback to variation price
  });
});
