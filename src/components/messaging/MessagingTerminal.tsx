import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "./SearchBar";
import { MessageBubble } from "./MessageBubble";
import { AttachmentUploader } from "./AttachmentUploader";
import { getOrCreateConversation, markAsRead } from "@/lib/messaging";
import { toast } from "sonner";

interface Conversation {
  id: string;
  type: 'direct' | 'group';
  otherUser?: {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
  };
  lastMessage?: string;
  messageCount: number;
}

export const MessagingTerminal = () => {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
    }
  }, [currentUser]);

  useEffect(() => {
    if (activeConv) {
      fetchMessages(activeConv.id);

      const channel = supabase
        .channel(`room-${activeConv.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeConv.id}` },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            // Increment message count for privacy logic
            setActiveConv(prev => prev ? { ...prev, messageCount: (prev.messageCount || 0) + 1 } : null);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `room_id=eq.${activeConv.id}` },
          (payload) => {
            setMessages((prev) => prev.map(m => m.id === payload.new.id ? payload.new : m));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [activeConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }

    // Mark messages as read when they appear
    if (activeConv && messages.length > 0 && currentUser) {
      const unreadIds = messages
        .filter(m => m.sender_id !== currentUser.id && (!m.read_by || !m.read_by.includes(currentUser.id)))
        .map(m => m.id);

      if (unreadIds.length > 0) {
        markAsRead(unreadIds, currentUser.id);
      }
    }
  }, [messages]);

  const fetchConversations = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const { data: participations, error } = await supabase
        .from('chat_participants')
        .select(`
          room_id,
          chat_rooms (
            id,
            type,
            chat_messages (content, created_at)
          )
        `)
        .eq('user_id', currentUser.id);

      if (error) throw error;

      const convs = await Promise.all((participations || []).map(async (p: any) => {
        const roomId = p.room_id;
        const { data: otherPart } = await supabase
          .from('chat_participants')
          .select('user_id, profiles(id, username, full_name, avatar_url)')
          .eq('room_id', roomId)
          .neq('user_id', currentUser.id)
          .single();

        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('room_id', roomId);

        const lastMsg = p.chat_rooms.chat_messages?.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];

        return {
          id: roomId,
          type: p.chat_rooms.type,
          otherUser: otherPart?.profiles as any,
          lastMessage: lastMsg?.content,
          messageCount: count || 0
        };
      }));

      setConversations(convs);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
  };

  const handleUserSelect = async (userId: string) => {
    if (!currentUser) return;
    try {
      const roomId = await getOrCreateConversation(currentUser.id, userId);
      // Re-fetch to get the full conversation object
      await fetchConversations();
      const existing = conversations.find(c => c.id === roomId);
      if (existing) {
        setActiveConv(existing);
      } else {
         // If it's brand new and not yet in state
         const { data: otherProfile } = await supabase.from('profiles').select('*').eq('id', userId).single();
         setActiveConv({
           id: roomId,
           type: 'direct',
           otherUser: otherProfile as any,
           messageCount: 0
         });
      }
    } catch (error) {
      toast.error("Failed to start conversation");
    }
  };

  const handleSendMessage = async (attachment?: { url: string; type: 'image' | 'file' }) => {
    if ((!newMessage.trim() && !attachment) || !activeConv || !currentUser || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeConv.id,
          sender_id: currentUser.id,
          content: newMessage.trim(),
          attachment_url: attachment?.url,
          attachment_type: attachment?.type,
        });

      if (error) throw error;
      setNewMessage("");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-full flex flex-col shadow-none border-none bg-transparent">
      <CardHeader className="p-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-display flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messaging
          </CardTitle>
          {activeConv && (
            <Button variant="ghost" size="sm" onClick={() => setActiveConv(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
        </div>
        {!activeConv && <SearchBar onUserSelect={handleUserSelect} />}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : activeConv ? (
          <ScrollArea className="h-full p-4">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                otherUserName={activeConv.otherUser?.username || activeConv.otherUser?.full_name || "User"}
                isPrivacyRestricted={activeConv.messageCount < 3}
              />
            ))}
            <div ref={scrollRef} />
          </ScrollArea>
        ) : (
          <ScrollArea className="h-full">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-8 text-center">
                <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                <p>No conversations yet.</p>
                <p className="text-xs">Search for a user to start chatting.</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b transition-colors"
                  onClick={() => setActiveConv(conv)}
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {conv.otherUser?.username?.slice(0, 2).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold truncate">
                        {conv.messageCount < 3
                          ? `User ${conv.otherUser?.id.slice(0, 6)}`
                          : (conv.otherUser?.username || conv.otherUser?.full_name)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{conv.lastMessage || "No messages yet"}</p>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        )}
      </CardContent>

      {activeConv && (
        <CardFooter className="p-4 border-t flex flex-col gap-2">
          <div className="flex w-full items-center gap-2">
            <AttachmentUploader onUploadComplete={(att) => handleSendMessage(att)} />
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={sending}
            />
            <Button size="icon" onClick={() => handleSendMessage()} disabled={sending || !newMessage.trim()}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};
