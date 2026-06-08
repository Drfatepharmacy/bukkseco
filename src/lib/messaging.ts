import { supabase } from "@/integrations/supabase/client";

export const getOrCreateConversation = async (_currentUserId: string, otherUserId: string) => {
  const { data, error } = await supabase.rpc("get_or_create_direct_room", {
    _other_user: otherUserId,
  });
  if (error) throw error;
  return data as string;
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
