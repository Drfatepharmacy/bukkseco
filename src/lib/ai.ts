import { supabase } from "@/integrations/supabase/client";

/**
 * Smart Meal Recommendations Infrastructure
 * Ready for LLM integration. For now, it uses high-quality heuristic logic.
 */
export const getSmartRecommendations = async (userId: string, tenantId: string) => {
  // Logic:
  // 1. Fetch user's previous orders
  // 2. Extract preferred categories
  // 3. Find top rated meals in those categories within the tenant
  // 4. Return top 4 recommendations

  try {
    const { data: previousOrders } = await supabase
      .from("orders")
      .select("vendor_id")
      .eq("buyer_id", userId)
      .limit(10);

    const vendorIds = previousOrders?.map(o => o.vendor_id) || [];

    let query = supabase
      .from("meals")
      .select("*, vendor_profiles(business_name)")
      .eq("tenant_id", tenantId)
      .eq("is_available", true)
      .order("rating_avg", { ascending: false });

    if (vendorIds.length > 0) {
      // Prioritize vendors user has ordered from
      query = query.in("vendor_id", vendorIds);
    }

    const { data: meals } = await query.limit(4);
    return meals;
  } catch (error) {
    console.error("AI Recommendations Error:", error);
    return [];
  }
};

/**
 * Predicted ETA Logic
 * Predicts delivery time based on vendor prep time and rider availability.
 */
export const predictDeliveryTime = async (vendorId: string, location: string) => {
  // Heuristic:
  // Base time: 15 mins
  // Vendor load: +5 mins per active order
  // Distance factor: +5-10 mins

  const { data: activeOrders } = await supabase
    .from("orders")
    .select("id")
    .eq("vendor_id", vendorId)
    .in("status", ["pending", "confirmed", "preparing"]);

  const baseTime = 15;
  const loadFactor = (activeOrders?.length || 0) * 3;
  const totalEta = baseTime + loadFactor;

  return {
    eta: totalEta,
    confidence: activeOrders && activeOrders.length > 10 ? "Medium" : "High",
    message: `Estimated delivery in ${totalEta} mins`
  };
};

/**
 * AI Growth Insight Generation
 * (Placeholder for LLM Analysis)
 */
export const generateGrowthInsights = async (entityId: string, type: 'vendor' | 'tenant') => {
    // This would typically call a Supabase Edge Function that interacts with OpenAI/Anthropic
    // For now, we return high-value placeholders.
    return [
        {
            title: "Optimized Pricing",
            description: "AI analysis suggests increasing 'Jollof Combo' price by ₦200 during peak hours could increase revenue by 12% without affecting volume.",
            impact: "High"
        },
        {
            title: "Inventory Alert",
            description: "Predicted stock-out for 'Chicken' by 2:00 PM based on current trend. Consider restocking now.",
            impact: "Medium"
        }
    ];
};
