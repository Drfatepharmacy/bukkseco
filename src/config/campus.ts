/** UNIBEN delivery points shown at checkout. */
export const CAMPUS_DELIVERY_POINTS = [
  "Hall 1", "Hall 2", "Hall 3", "Hall 4", "Hall 5",
  "Keystone", "Faculty of Engineering", "Faculty of Science", "Main Gate", "Ekehuan Campus",
];

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
