export interface NominatimAddress {
  displayName: string;
  lat: number;
  lng: number;
  address?: Record<string, string>;
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// OSM Usage Policy: include a meaningful User-Agent & Referer
const NOMINATIM_HEADERS = {
  Accept: "application/json",
  "User-Agent": "HPF-FoodDelivery/1.0 (contact@hpf.com)",
};

export async function reverseGeocode(lat: number, lng: number): Promise<NominatimAddress | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    zoom: "18",         // max zoom = most granular address
    accept_language: "en",
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
    });

    if (!response.ok) return null;
    const data = await response.json();

    return {
      displayName: data.display_name || "",
      lat: Number(data.lat),
      lng: Number(data.lon),
      address: data.address,
    };
  } catch {
    return null;
  }
}

export async function searchAddress(query: string): Promise<NominatimAddress[]> {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "7",
    addressdetails: "1",
    countrycodes: "in",   // restrict to India for faster & more relevant results
    accept_language: "en",
  });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
    });

    if (!response.ok) return [];
    const data = await response.json();

    return data.map((item: any) => ({
      displayName: item.display_name || "",
      lat: Number(item.lat),
      lng: Number(item.lon),
      address: item.address,
    }));
  } catch {
    return [];
  }
}

/**
 * Build the best possible street string from an OSM address object.
 * OSM data in India rarely has house_number/road — this handles all cases.
 */
export function buildIndianStreet(addr: Record<string, string>, displayName: string): string {
  const parts = [
    addr.house_number || addr.house_name,
    addr.road || addr.pedestrian || addr.footway || addr.path,
    addr.quarter || addr.neighbourhood || addr.suburb || addr.village,
  ].filter(Boolean);

  if (parts.length > 0) return parts.join(", ");

  // Fallback: first 2 comma-separated segments of the display_name
  return displayName.split(",").slice(0, 2).join(",").trim();
}
