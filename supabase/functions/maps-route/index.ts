// Google Routes API proxy — keeps the server-restricted key out of the browser.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const key = Deno.env.get("GOOGLE_MAPS_SERVER_KEY") ?? Deno.env.get("GOOGLE_MAPS_BROWSER_KEY");
  if (!key) return json({ error: "maps_not_configured" }, 503);

  try {
    const { origin, destination, mode } = await req.json();
    if (!origin?.lat || !destination?.lat) return json({ error: "invalid_request" }, 400);

    const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: {
          location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
        },
        travelMode: mode === "walk" ? "WALK" : "TWO_WHEELER",
        polylineQuality: "HIGH_QUALITY",
      }),
    });

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return json({ error: "no_route" }, 404);

    return json({
      polyline: route.polyline?.encodedPolyline ?? "",
      duration: Number(String(route.duration ?? "0s").replace("s", "")),
      distance: route.distanceMeters ?? 0,
    });
  } catch (e) {
    console.error("maps-route error", e);
    return json({ error: "route_failed" }, 500);
  }
});
