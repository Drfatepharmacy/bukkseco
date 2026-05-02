import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { useAuth } from "@/contexts/AuthContext";
import { markAsRead } from "@/lib/messaging";

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  media_url: string | null;
  read_at: string | null;
  created_at: string;
}

export interface TypingEvent {
  user_id: string;
  at: number;
}

/**
 * Real-time messaging hook backed by Supabase Realtime.
 * - Subscribes to `chat_messages` INSERT/UPDATE for the room
 * - Broadcasts typing events on the room channel
 * - Auto-marks incoming messages from others as read
 */
export const useMessaging = (roomId: string | null | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initial load + realtime subscription
  useEffect(() => {
    if (!roomId || !user) {
      setMessages([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages(data || []);
      setLoading(false);

      // Mark unread inbound on mount
      const unread = (data || [])
        .filter((m) => m.sender_id !== user.id && !m.read_at)
        .map((m) => m.id);
      if (unread.length) markAsRead(unread, user.id);
    })();

    const channel = supabase
      .channel(`chat-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const msg = payload.new as ChatMessage;
          setMessages((prev) => (prev.find((m) => m.id === msg.id) ? prev : [...prev, msg]));
          if (msg.sender_id !== user.id) markAsRead([msg.id], user.id);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `room_id=eq.${roomId}` },
        (payload) => {
          const upd = payload.new as ChatMessage;
          setMessages((prev) => prev.map((m) => (m.id === upd.id ? upd : m)));
        },
      )
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        if (!payload?.user_id || payload.user_id === user.id) return;
        setTypingUsers((prev) => ({ ...prev, [payload.user_id]: Date.now() }));
      })
      .subscribe();

    channelRef.current = channel;

    // Sweep stale typing indicators every 2s
    const sweep = setInterval(() => {
      setTypingUsers((prev) => {
        const now = Date.now();
        const next: Record<string, number> = {};
        for (const [uid, ts] of Object.entries(prev)) {
          if (now - ts < 4000) next[uid] = ts;
        }
        return next;
      });
    }, 2000);

    return () => {
      cancelled = true;
      clearInterval(sweep);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [roomId, user]);

  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string | null) => {
      if (!roomId || !user || (!content?.trim() && !mediaUrl)) return null;
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({
          room_id: roomId,
          sender_id: user.id,
          content: content.trim(),
          media_url: mediaUrl ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    [roomId, user],
  );

  const sendTyping = useCallback(() => {
    if (!channelRef.current || !user) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: user.id },
    });
  }, [user]);

  return {
    messages,
    typingUserIds: Object.keys(typingUsers),
    loading,
    sendMessage,
    sendTyping,
  };
};

export default useMessaging;
