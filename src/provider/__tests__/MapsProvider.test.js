import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import MapsProvider, { MapsContext } from '../MapsProvider';

// ── Mock global fetch ─────────────────────────────────────────────────────────

const mockFetch = jest.fn();
global.fetch = mockFetch;

// ── Helper: buat response mock yang sukses ────────────────────────────────────

const mockResponse = (data, ok = true) => ({
  ok,
  json: jest.fn().mockResolvedValue(data),
});

// ── Photon API sample response ─────────────────────────────────────────────────

const photonSearchResult = {
  features: [
    {
      properties: {
        osm_type: 'W',
        osm_id: 12345,
        name: 'Toko Basegar',
        street: 'Jl. Merdeka',
        locality: 'Gambir',
        city: 'Jakarta Pusat',
        state: 'DKI Jakarta',
        country: 'Indonesia',
      },
      geometry: { coordinates: [106.8456, -6.2146] }, // [lng, lat]
    },
  ],
};

const photonReverseResult = {
  features: [
    {
      properties: {
        osm_type: 'N',
        osm_id: 99999,
        name: 'Warung Makan',
        street: 'Jl. Sudirman',
        city: 'Jakarta Selatan',
        state: 'DKI Jakarta',
        country: 'Indonesia',
      },
      geometry: { coordinates: [106.8272, -6.2088] },
    },
  ],
};

// ── Helper: render provider & ambil konteks ────────────────────────────────────

const renderProvider = () => {
  let ctx = null;
  const TestConsumer = () => {
    ctx = React.useContext(MapsContext);
    return null;
  };

  let root;
  TestRenderer.act(() => {
    root = TestRenderer.create(
      <MapsProvider>
        <TestConsumer />
      </MapsProvider>
    );
  });

  return { root, getCtx: () => ctx };
};

// ═════════════════════════════════════════════════════════════════════════════
// TEST SUITES
// ═════════════════════════════════════════════════════════════════════════════

describe('MapsProvider — getLacationBySearch (pencarian alamat)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('harus mengembalikan predictions kosong jika keyword kosong', async () => {
    const { getCtx } = renderProvider();

    let result;
    await act(async () => {
      result = await getCtx().getLacationBySearch('');
    });

    expect(result).toEqual({ predictions: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('harus mengembalikan predictions kosong jika keyword hanya spasi', async () => {
    const { getCtx } = renderProvider();

    let result;
    await act(async () => {
      result = await getCtx().getLacationBySearch('   ');
    });

    expect(result).toEqual({ predictions: [] });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('harus memetakan respons Photon menjadi format predictions yang benar', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(photonSearchResult));

    const { getCtx } = renderProvider();

    let result;
    await act(async () => {
      result = await getCtx().getLacationBySearch('Basegar');
    });

    expect(result.predictions).toHaveLength(1);
    const pred = result.predictions[0];

    // place_id menggunakan format photon_<type>_<id>
    expect(pred.place_id).toBe('photon_W_12345');

    // Koordinat harus dikonversi: coords[1]=lat, coords[0]=lng
    expect(pred.geometry.lat).toBe(-6.2146);
    expect(pred.geometry.lng).toBe(106.8456);

    // main_text harus menggunakan nama properti
    expect(pred.structured_formatting.main_text).toBe('Toko Basegar');
  });

  it('harus memastikan URL Photon mengandung keyword yang di-encode', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(photonSearchResult));

    const { getCtx } = renderProvider();
    await act(async () => {
      await getCtx().getLacationBySearch('Jl. Merdeka No 5');
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('photon.komoot.io');
    expect(calledUrl).toContain(encodeURIComponent('Jl. Merdeka No 5'));
  });

  it('harus fallback ke Nominatim jika Photon gagal (response not ok)', async () => {
    // Photon: tidak ok
    mockFetch.mockResolvedValueOnce({ ok: false, json: jest.fn() });

    // Nominatim: berhasil
    const nominatimResult = [
      {
        place_id: 'nom_111',
        display_name: 'Kampung Rambutan, Jakarta Timur, DKI Jakarta, Indonesia',
        lat: '-6.2946',
        lon: '106.8750',
        name: 'Kampung Rambutan',
      }
    ];
    mockFetch.mockResolvedValueOnce(mockResponse(nominatimResult));

    const { getCtx } = renderProvider();
    let result;
    await act(async () => {
      result = await getCtx().getLacationBySearch('Kampung Rambutan');
    });

    expect(result.predictions).toHaveLength(1);
    expect(result.predictions[0].place_id).toBe('nominatim_nom_111');
    expect(result.predictions[0].geometry.lat).toBe(-6.2946);
    expect(result.predictions[0].geometry.lng).toBe(106.875);
  });

  it('harus mengembalikan predictions kosong jika Photon & Nominatim keduanya gagal', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, json: jest.fn() }) // Photon gagal
      .mockRejectedValueOnce(new Error('Network Error'));      // Nominatim throw

    const { getCtx } = renderProvider();
    let result;
    await act(async () => {
      result = await getCtx().getLacationBySearch('xyz abc');
    });

    expect(result).toEqual({ predictions: [] });
  });
});

describe('MapsProvider — getAddressByCoords (reverse geocoding)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('harus mengembalikan alamat lengkap dari koordinat via Photon', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(photonReverseResult));

    const { getCtx } = renderProvider();
    let result;
    await act(async () => {
      result = await getCtx().getAddressByCoords(-6.2088, 106.8272);
    });

    expect(result.place_id).toBe('photon_N_99999');
    expect(result.geometry.lat).toBe(-6.2088);
    expect(result.geometry.lng).toBe(106.8272);
    expect(result.structured_formatting.main_text).toBe('Warung Makan');
  });

  it('harus memastikan URL Photon reverse memakai lat & lng yang benar', async () => {
    mockFetch.mockResolvedValueOnce(mockResponse(photonReverseResult));

    const { getCtx } = renderProvider();
    await act(async () => {
      await getCtx().getAddressByCoords(-6.1234, 106.5678);
    });

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('photon.komoot.io/reverse');
    expect(calledUrl).toContain('lat=-6.1234');
    expect(calledUrl).toContain('lon=106.5678');
  });

  it('harus fallback ke koordinat GPS jika Photon & Nominatim keduanya gagal', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: false, json: jest.fn() }) // Photon gagal
      .mockRejectedValueOnce(new Error('timeout'));            // Nominatim throw

    const { getCtx } = renderProvider();
    let result;
    const lat = -6.999;
    const lng = 107.123;

    await act(async () => {
      result = await getCtx().getAddressByCoords(lat, lng);
    });

    // Fallback menggunakan koordinat mentah
    expect(result.place_id).toBe(`coords_${lat}_${lng}`);
    expect(result.structured_formatting.main_text).toBe('Lokasi GPS');
    expect(result.geometry.lat).toBe(lat);
    expect(result.geometry.lng).toBe(lng);
  });

  it('harus fallback ke Nominatim jika Photon reverse tidak ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, json: jest.fn() }); // Photon tidak ok

    const nominatimReverse = {
      place_id: 'nom_reverse_555',
      display_name: 'Jl. Gatot Subroto, Kuningan, Jakarta Selatan, DKI Jakarta, 12950, Indonesia',
      lat: '-6.2302',
      lon: '106.8305',
    };
    mockFetch.mockResolvedValueOnce(mockResponse(nominatimReverse));

    const { getCtx } = renderProvider();
    let result;
    await act(async () => {
      result = await getCtx().getAddressByCoords(-6.2302, 106.8305);
    });

    expect(result.place_id).toBe('nominatim_nom_reverse_555');
    expect(result.structured_formatting.main_text).toBe('Jl. Gatot Subroto');
  });
});
