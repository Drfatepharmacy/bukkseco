/** UNIBEN delivery points shown at checkout. */
export const CAMPUS_DELIVERY_POINTS = [
  "Hall 1", "Hall 2", "Hall 3", "Hall 4", "Hall 5",
  "Keystone", "Faculty of Engineering", "Faculty of Science", "Main Gate", "Ekehuan Campus",
];

/**
 * Approximate map positions for drop-off points (UNIBEN Ugbowo).
 * Estimates — confirm with on-campus checks before relying on them.
 */
export const CAMPUS_POINT_COORDS: Record<string, { lat: number; lng: number }> = {
  "Hall 1": { lat: 6.3985, lng: 5.6105 },
  "Hall 2": { lat: 6.3978, lng: 5.6118 },
  "Hall 3": { lat: 6.3970, lng: 5.6130 },
  "Hall 4": { lat: 6.3962, lng: 5.6142 },
  "Hall 5": { lat: 6.3955, lng: 5.6155 },
  "Keystone": { lat: 6.4012, lng: 5.6088 },
  "Faculty of Engineering": { lat: 6.4030, lng: 5.6170 },
  "Faculty of Science": { lat: 6.4005, lng: 5.6140 },
  "Main Gate": { lat: 6.3925, lng: 5.6040 },
  "Ekehuan Campus": { lat: 6.3620, lng: 5.6020 },
};

export const pointCoords = (address?: string | null) => {
  if (!address) return null;
  const key = Object.keys(CAMPUS_POINT_COORDS).find((k) => address.toLowerCase().includes(k.toLowerCase()));
  return key ? CAMPUS_POINT_COORDS[key] : null;
};

/** Order progress shown to students, in order. */
export const ORDER_STAGES = [
  { key: "pending", label: "Order placed" },
  { key: "confirmed", label: "Vendor accepted" },
  { key: "preparing", label: "Being prepared" },
  { key: "ready", label: "Ready for pickup" },
  { key: "rider_assigned", label: "Rider assigned" },
  { key: "out_for_delivery", label: "On the way" },
  { key: "delivered", label: "Delivered" },
] as const;

export const stageIndex = (status?: string | null) =>
  Math.max(0, ORDER_STAGES.findIndex((s) => s.key === status));
