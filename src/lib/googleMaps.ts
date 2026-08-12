import { supabase } from "@/integrations/supabase/client";

/**
 * Google Maps Platform loader.
 *
 * The browser key is never committed to the repo — it is served at runtime by the
 * `maps-config` edge function and is expected to be HTTP-referrer restricted to the
 * approved Bukks domains, with only the Maps JavaScript + Places APIs enabled.
 * Privileged (server-restricted) credentials stay inside edge functions.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GMaps = any;

let loader: Promise<GMaps> | null = null;

const injectScript = (key: string) =>
  new Promise<GMaps>((resolve, reject) => {
    const w = window as unknown as { google?: { maps?: GMaps } };
    if (w.google?.maps) return resolve(w.google.maps);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      key
    )}&libraries=places,geometry,marker&v=weekly&loading=async`;
    script.async = true;
    script.onload = () => {
      const g = (window as unknown as { google?: { maps?: GMaps } }).google?.maps;
      g ? resolve(g) : reject(new Error("Google Maps failed to initialise"));
    };
    script.onerror = () => reject(new Error("Google Maps script failed to load"));
    document.head.appendChild(script);
  });

export const loadGoogleMaps = (): Promise<GMaps> => {
  if (loader) return loader;
  loader = (async () => {
    const { data, error } = await supabase.functions.invoke("maps-config");
    if (error || !data?.key) throw new Error("Google Maps is not configured");
    return injectScript(data.key as string);
  })();
  loader = loader.catch((e) => {
    loader = null;
    throw e;
  });
  return loader;
};

export interface RouteResult {
  /** Encoded polyline for the route. */
  polyline: string;
  /** Seconds. */
  duration: number;
  /** Metres. */
  distance: number;
}

/** Routes API call, executed server-side with a server-restricted key. */
export const getRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<RouteResult | null> => {
  const { data, error } = await supabase.functions.invoke("maps-route", {
    body: { origin, destination },
  });
  if (error || !data?.polyline) return null;
  return data as RouteResult;
};

export const BUKKS_CAMPUS_CENTER = { lat: 6.4, lng: 5.61 };

/** Dark Bukks map styling (used with the classic styled-map API). */
export const BUKKS_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0b0d18" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0b0d18" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8b8fa3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1b1f30" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9aa0b5" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1a2a" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];
