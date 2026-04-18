import { supabase } from "@/integrations/supabase/client";

export const getOrCreateConversation = async (currentUserId: string, otherUserId: string) => {
  // Check if a direct conversation already exists between these two users
  const { data: participations, error: partError } = await supabase
    .from("chat_participants")
    .select("room_id")
    .eq("user_id", currentUserId);

  if (partError) throw partError;

  if (participations && participations.length > 0) {
    const roomIds = participations.map(p => p.room_id);

    // Find a room where the other user is also a participant and room type is 'direct'
    const { data: commonRooms, error: roomError } = await supabase
      .from("chat_participants")
      .select("room_id, chat_rooms!inner(type)")
      .in("room_id", roomIds)
      .eq("user_id", otherUserId)
      .eq("chat_rooms.type", "direct");

    if (roomError) throw roomError;

    if (commonRooms && commonRooms.length > 0) {
      return commonRooms[0].room_id;
    }
  }

  // If no conversation exists, create one
  const { data: newRoom, error: createRoomError } = await supabase
    .from("chat_rooms")
    .insert({ type: "direct" })
    .select()
    .single();

  if (createRoomError) throw createRoomError;

  const { error: participantError } = await supabase
    .from("chat_participants")
    .insert([
      { room_id: newRoom.id, user_id: currentUserId },
      { room_id: newRoom.id, user_id: otherUserId }
    ]);

  if (participantError) throw participantError;

  return newRoom.id;
};

export const uploadAttachment = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
  const filePath = `chat/${fileName}`;

  const { error: uploadError, data } = await supabase.storage
    .from('chat-attachments')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(filePath);

  return {
    url: publicUrl,
    type: file.type.startsWith('image/') ? 'image' : 'file' as const,
    name: file.name
  };
};

export const markAsRead = async (messageIds: string[], userId: string) => {
  if (messageIds.length === 0) return;

  // This is a bit tricky with uuid[] in Supabase via JS client
  // We'll use a RPC or a raw query if needed, but for now we try to use the array logic
  // Since we want to APPEND to the read_by array

  // Note: Standard Supabase client doesn't support array_append directly in .update()
  // We might need an RPC for this for a production-ready app.
  // For now, I'll implement it using a simple update or assume the first read is enough.
  // Actually, the requirement says "Add current user to read_by array"

  const { error } = await supabase.rpc('mark_messages_as_read', {
    message_ids: messageIds,
    user_id: userId
  });

  return { error };
};
