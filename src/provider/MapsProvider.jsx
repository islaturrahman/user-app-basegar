import React, { useEffect, useState, createContext } from "react";

const fetchWithTimeout = async (resource, options = {}) => {
  const { timeout = 3500 } = options;
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal  
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const MapsContext = createContext();

const MapsProvider = ({ children }) => {
  const [locationBySearch, setLocationBySearch] = useState([]);

  // Search Address using Photon API (Komoot)
  const getLacationBySearch = async (key) => {
    if (!key || key.trim().length === 0) {
      return { predictions: [] };
    }

    try {
      const response = await fetchWithTimeout(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(key)}&limit=10`,
        { timeout: 3500 }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.features) {
          const predictions = data.features.map((item) => {
            const props = item.properties;
            const coords = item.geometry.coordinates; // [lng, lat]
            
            const mainText = props.name || props.street || "Lokasi";
            const secondaryParts = [
              props.street && props.street !== mainText ? props.street : null,
              props.locality || props.district,
              props.city,
              props.state,
              props.country || "Indonesia"
            ].filter(Boolean);
            
            const secondaryText = secondaryParts.length > 0 ? secondaryParts.join(", ") : "Indonesia";
            const description = [mainText, secondaryText].filter(Boolean).join(", ");
            
            return {
              place_id: `photon_${props.osm_type}_${props.osm_id}`,
              description: description,
              structured_formatting: {
                main_text: mainText,
                secondary_text: secondaryText
              },
              geometry: {
                lat: coords[1],
                lng: coords[0]
              }
            };
          });
          return { predictions };
        }
      } else {
        // Silently ignore failed status to allow fallback
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("Photon search error:", error.message);
      }
    }

    // Fallback to Nominatim
    try {
      const response = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(key)}&format=json&addressdetails=1&limit=10&countrycodes=id`,
        {
          headers: {
            "User-Agent": "BasegarApp/1.0 (dev@basegar.com)",
            "Accept": "application/json"
          },
          timeout: 5000
        }
      );
      if (response.ok) {
        const data = await response.json();
        const predictions = data.map((item) => {
          const mainText = item.display_name.split(",")[0] || item.name || "Lokasi";
          const secondaryText = item.display_name.split(",").slice(1).join(", ").trim() || "Indonesia";
          return {
            place_id: `nominatim_${item.place_id}`,
            description: item.display_name,
            structured_formatting: {
              main_text: mainText,
              secondary_text: secondaryText
            },
            geometry: {
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }
          };
        });
        return { predictions };
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("Nominatim fallback search error:", error.message);
      }
    }

    return { predictions: [] };
  };

  // Reverse Geocode Address by Coords using Photon API (Komoot)
  const getAddressByCoords = async (lat, lng) => {
    try {
      const response = await fetchWithTimeout(
        `https://photon.komoot.io/reverse?lon=${lng}&lat=${lat}`,
        { timeout: 3500 }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.features && data.features.length > 0) {
          const item = data.features[0];
          const props = item.properties;
          const coords = item.geometry.coordinates;
          
          const mainText = props.name || props.street || "Lokasi Saat Ini";
          const secondaryParts = [
            props.street && props.street !== mainText ? props.street : null,
            props.locality || props.district,
            props.city,
            props.state,
            props.country || "Indonesia"
          ].filter(Boolean);
          
          const secondaryText = secondaryParts.length > 0 ? secondaryParts.join(", ") : "Indonesia";
          const description = [mainText, secondaryText].filter(Boolean).join(", ");
          
          return {
            place_id: `photon_${props.osm_type}_${props.osm_id}`,
            description: description,
            structured_formatting: {
              main_text: mainText,
              secondary_text: secondaryText
            },
            geometry: {
              lat: lat,
              lng: lng
            }
          };
        }
      } else {
        // Silently ignore failed status
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("Photon reverse error:", error.message);
      }
    }

    // Fallback to Nominatim
    try {
      const response = await fetchWithTimeout(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            "User-Agent": "BasegarApp/1.0 (dev@basegar.com)",
            "Accept": "application/json"
          },
          timeout: 5000
        }
      );
      if (response.ok) {
        const item = await response.json();
        if (item && item.display_name) {
          const mainText = item.display_name.split(",")[0] || item.name || "Lokasi Saat Ini";
          const secondaryText = item.display_name.split(",").slice(1).join(", ").trim() || "Indonesia";
          return {
            place_id: `nominatim_${item.place_id}`,
            description: item.display_name,
            structured_formatting: {
              main_text: mainText,
              secondary_text: secondaryText
            },
            geometry: {
              lat: lat,
              lng: lng
            }
          };
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.warn("Nominatim fallback reverse error:", error.message);
      }
    }

    // Ultimate Fallback if Photon fails
    return {
      place_id: `coords_${lat}_${lng}`,
      description: `Lokasi GPS (${lat.toFixed(5)}, ${lng.toFixed(5)})`,
      structured_formatting: {
        main_text: "Lokasi GPS",
        secondary_text: `${lat.toFixed(5)}, ${lng.toFixed(5)}`
      },
      geometry: {
        lat: lat,
        lng: lng
      }
    };
  };

  useEffect(() => {}, []);

  const value = {
    locationBySearch,
    getLacationBySearch,
    getAddressByCoords
  };

  return <MapsContext.Provider value={value}>{children}</MapsContext.Provider>;
};

export default MapsProvider;