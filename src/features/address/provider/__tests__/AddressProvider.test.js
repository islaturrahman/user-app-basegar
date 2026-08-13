import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AddressProvider from '../AddressProvider';
import AddressContext from '../../../../context/AddressContext';
import * as api from '../../../../data/api';

jest.mock('../../../../data/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  apiRequest: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

describe('AddressProvider — flow simpan alamat dari Maps', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  const renderAddressProvider = () => {
    let ctxValue;
    let root;
    TestRenderer.act(() => {
      root = TestRenderer.create(
        <AddressProvider>
          <AddressContext.Consumer>
            {(value) => {
              ctxValue = value;
              return null;
            }}
          </AddressContext.Consumer>
        </AddressProvider>
      );
    });
    return { root, getCtx: () => ctxValue };
  };

  it('harus memproses penyimpanan alamat baru dan memastikan alamat terpilih dengan benar', async () => {
    // Karena tidak ada authToken di AsyncStorage, useEffect tidak memanggil API saat init.
    // Pemanggilan pertama ke address/list justru saat addCustomerAddress() memanggil getAddress() untuk refresh.
    // Maka mock langsung mengembalikan data alamat baru tanpa perlu counter.
    const mockAddressData = {
      id: 101,
      address_type: 'Home',
      contact_person_name: 'Budi',
      contact_person_number: '0812345678',
      address: 'Jl. Merdeka No. 1, Jakarta',
      latitude: '-6.200000',
      longitude: '106.816666'
    };

    api.get.mockImplementation(async (url) => {
      if (url.includes('customer/address/list')) {
        return [mockAddressData];
      }
      return { status: false }; // last_ordered_address dll.
    });

    api.post.mockResolvedValue({ message: 'Success' });

    let root, getCtx;
    await act(async () => {
      const res = renderAddressProvider();
      root = res.root;
      getCtx = res.getCtx;
      await new Promise(r => setTimeout(r, 0));
    });

    const ctx = getCtx();

    // 2. Simulasi User menekan tombol Simpan Alamat setelah memilih lokasi di Maps
    const newAddressData = {
      address_type: 'Home',
      contact_person_name: 'Budi',
      contact_person_number: '0812345678',
      address: 'Jl. Merdeka No. 1, Jakarta',
      latitude: '-6.200000',
      longitude: '106.816666'
    };

    let addedResult;
    await act(async () => {
      addedResult = await ctx.addCustomerAddress(newAddressData);
    });

    // Verifikasi POST API dipanggil untuk menyimpan
    expect(api.post).toHaveBeenCalledTimes(1);

    // Verifikasi setelah submit, AddressProvider menyimpan ke AsyncStorage secara otomatis
    const storedStr = await AsyncStorage.getItem("selectAddress");
    expect(storedStr).toBeTruthy();

    const storedAddress = JSON.parse(storedStr);
    expect(storedAddress.id).toBe(101);
    expect(storedAddress.address).toBe('Jl. Merdeka No. 1, Jakarta');

    // 3. Pastikan fungsi getSelectAddress() mengembalikan alamat yang sama
    let selectedAddress;
    await act(async () => {
      selectedAddress = await ctx.getSelectAddress();
    });

    expect(selectedAddress).toBeDefined();
    expect(selectedAddress.id).toBe(101);
    expect(selectedAddress.address).toBe('Jl. Merdeka No. 1, Jakarta');
  });

  it('harus memfallback ke alamat terbaru di list bila cache invalid', async () => {
    // Skenario: Cache berisi alamat ID 50 yang sudah dihapus di server
    await AsyncStorage.setItem("selectAddress", JSON.stringify({ id: 50, address: "Alamat Lama" }));
    
    api.get.mockImplementation(async (url) => {
      if (url.includes('customer/address/list')) {
        return [{ id: 99, address: "Alamat Valid Terbaru" }];
      }
      return { status: false };
    });

    let getCtx;
    await act(async () => {
      const res = renderAddressProvider();
      getCtx = res.getCtx;
      await new Promise(r => setTimeout(r, 0));
    });

    const ctx = getCtx();
    let selectedAddress;
    await act(async () => {
      selectedAddress = await ctx.getSelectAddress();
    });

    // Karena ID 50 tidak ada di `freshAddresses`, fallback ke alamat pertama yang ada (ID 99)
    expect(selectedAddress.id).toBe(99);
    
    // AsyncStorage harus otomatis diperbarui
    const stored = JSON.parse(await AsyncStorage.getItem("selectAddress"));
    expect(stored.id).toBe(99);
  });
});
