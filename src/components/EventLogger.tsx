import { supabase } from "@/integrations/supabase/client";

/**
 * Utility to log events to the event_logs table for audit trail.
 */
export const logEvent = async ({
  eventType,
  actorId,
  targetType,
  targetId,
  metadata = {},
}: {
  eventType: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
}) => {
  try {
    await supabase.from("event_logs").insert({
      event_type: eventType,
      actor_id: actorId,
      target_type: targetType,
      target_id: targetId,
      metadata: metadata as any,
    });
  } catch (err) {
    console.error("Failed to log event:", err);
  }
};
