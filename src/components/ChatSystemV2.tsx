import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Search, ArrowLeft, Paperclip, Check, CheckCheck, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSoundNotification } from "@/hooks/useSoundNotification";
import { toast } from "sonner";

interface ChatRoom {
  id: string;
  type: string;
  name: string | null;
  created_at: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  otherUser?: { id: string; full_name: string; email: string; avatar_url?: string | null };
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  media_url: string | null;
  senderName?: string;
}

interface UserPresence {
  user_id: string;
  status: string;
  last_seen: string;
}

const ChatSystemV2 = () => {
  const { user } = useAuth();
  const { playSound } = useSoundNotification();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update own presence
  useEffect(() => {
    if (!user) return;
    const updatePresence = async () => {
      await supabase.from("user_presence").upsert({
        user_id: user.id,
        status: "online",
        last_seen: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };
    updatePresence();
    const interval = setInterval(updatePresence, 30000);

    // Set offline on unmount
    return () => {
      clearInterval(interval);
      supabase.from("user_presence").upsert({
        user_id: user.id,
        status: "offline",
        last_seen: new Date().toISOString(),
      }, { onConflict: "user_id" });
    };
  }, [user]);

  // Subscribe to presence changes
  useEffect(() => {
    const channel = supabase
      .channel("presence-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_presence" }, (payload) => {
        const p = payload.new as UserPresence;
        if (p?.user_id) {
          setPresenceMap(prev => ({ ...prev, [p.user_id]: p }));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch chat rooms
  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      const { data: participations } = await supabase
        .from("chat_participants").select("room_id").eq("user_id", user.id);
      if (!participations?.length) return;

      const roomIds = participations.map(p => p.room_id);
      const { data: roomData } = await supabase.from("chat_rooms").select("*").in("id", roomIds);
      if (!roomData) return;

      const enriched = await Promise.all(roomData.map(async (room) => {
        const { data: participants } = await supabase
          .from("chat_participants").select("user_id").eq("room_id", room.id).neq("user_id", user.id);

        let otherUser: any;
        if (participants?.[0]) {
          const { data: profile } = await supabase
            .from("profiles").select("id, full_name, email, avatar_url").eq("id", participants[0].user_id).single();
          otherUser = profile;

          // Fetch presence
          const { data: presence } = await supabase
            .from("user_presence").select("*").eq("user_id", participants[0].user_id).single();
          if (presence) setPresenceMap(prev => ({ ...prev, [presence.user_id]: presence }));
        }

        const { data: lastMsg } = await supabase
          .from("chat_messages").select("content, created_at").eq("room_id", room.id)
          .order("created_at", { ascending: false }).limit(1);

        return {
          ...room,
          otherUser,
          lastMessage: lastMsg?.[0]?.content,
          lastMessageTime: lastMsg?.[0]?.created_at,
        };
      }));

      setRooms(enriched.sort((a, b) => {
        const at = a.lastMessageTime || a.created_at;
        const bt = b.lastMessageTime || b.created_at;
        return new Date(bt).getTime() - new Date(at).getTime();
      }));
    };
    fetchRooms();
  }, [user]);

  // Fetch messages & subscribe
  useEffect(() => {
    if (!activeRoom || !user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages").select("*").eq("room_id", activeRoom.id)
        .order("created_at", { ascending: true });
      if (!data) return;

      const senderIds = [...new Set(data.map(m => m.sender_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
      const nameMap = Object.fromEntries((profiles || []).map(p => [p.id, p.full_name]));
      setMessages(data.map((m: any) => ({ ...m, read_at: m.read_at || null, media_url: m.media_url || null, senderName: nameMap[m.sender_id] || "Unknown" })));

      // Mark unread messages as read
      const unread = data.filter((m: any) => m.sender_id !== user.id && !m.read_at);
      if (unread.length > 0) {
        await supabase.from("chat_messages")
          .update({ read_at: new Date().toISOString() } as any)
          .in("id", unread.map(m => m.id));
      }
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-v2-${activeRoom.id}`)
      .on("postgres_changes", {
        event: "*", schema: "public", table: "chat_messages",
        filter: `room_id=eq.${activeRoom.id}`,
      }, async (payload) => {
        if (payload.eventType === "INSERT") {
          const msg = payload.new as ChatMessage;
          if (msg.sender_id !== user.id) {
            playSound("chat");
            // Auto-mark as read
            await supabase.from("chat_messages").update({ read_at: new Date().toISOString() } as any).eq("id", msg.id);
          }
          const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", msg.sender_id).single();
          setMessages(prev => [...prev, { ...msg, senderName: profile?.full_name || "Unknown" }]);
        } else if (payload.eventType === "UPDATE") {
          // Read receipt update
          const updated = payload.new as ChatMessage;
          setMessages(prev => prev.map(m => m.id === updated.id ? { ...m, read_at: updated.read_at } : m));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const uploadMedia = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/chat_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("food-images").upload(path, file);
    if (error) throw error;
    return supabase.storage.from("food-images").getPublicUrl(path).data.publicUrl;
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !mediaFile) || !activeRoom || !user) return;
    setUploading(true);

    try {
      let mediaUrl = null;
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      await supabase.from("chat_messages").insert({
        room_id: activeRoom.id,
        sender_id: user.id,
        content: newMessage.trim() || (mediaFile ? "📎 Attachment" : ""),
        media_url: mediaUrl,
      } as any);
      setNewMessage("");
      setMediaFile(null);
    } catch (err: any) {
      toast.error("Failed to send message");
    }
    setUploading(false);
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .neq("id", user?.id || "")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    const { data: myRooms } = await supabase.from("chat_participants").select("room_id").eq("user_id", user.id);
    if (myRooms) {
      for (const r of myRooms) {
        const { data: other } = await supabase
          .from("chat_participants").select("user_id").eq("room_id", r.room_id).eq("user_id", otherUserId).single();
        if (other) {
          const existing = rooms.find(rm => rm.id === r.room_id);
          if (existing) { setActiveRoom(existing); setShowNewChat(false); return; }
        }
      }
    }

    const { data: room } = await supabase.from("chat_rooms").insert({ type: "direct" as any }).select().single();
    if (room) {
      await supabase.from("chat_participants").insert([
        { room_id: room.id, user_id: user.id },
        { room_id: room.id, user_id: otherUserId },
      ]);
      const { data: profile } = await supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", otherUserId).single();
      const newRoom: ChatRoom = { ...room, otherUser: profile || undefined };
      setRooms(prev => [newRoom, ...prev]);
      setActiveRoom(newRoom);
      setShowNewChat(false);
    }
  };

  const getPresenceStatus = (userId?: string) => {
    if (!userId) return "offline";
    const p = presenceMap[userId];
    if (!p) return "offline";
    const diff = Date.now() - new Date(p.last_seen).getTime();
    if (p.status === "online" && diff < 60000) return "online";
    if (diff < 300000) return "idle";
    return "offline";
  };

  const PresenceDot = ({ userId }: { userId?: string }) => {
    const status = getPresenceStatus(userId);
    const color = status === "online" ? "bg-green-500" : status === "idle" ? "bg-yellow-500" : "bg-muted-foreground/30";
    return <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />;
  };

  const ReadReceipt = ({ msg }: { msg: ChatMessage }) => {
    if (msg.sender_id !== user?.id) return null;
    return msg.read_at
      ? <CheckCheck className="w-3 h-3 text-primary inline" />
      : <Check className="w-3 h-3 text-muted-foreground inline" />;
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Room list
  if (!activeRoom) {
    return (
      <Card className="border-border h-[600px] flex flex-col">
        <CardHeader className="border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-display text-base flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Messages
            </CardTitle>
            <Button size="sm" onClick={() => setShowNewChat(!showNewChat)}>
              {showNewChat ? "Cancel" : "New Chat"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {showNewChat ? (
            <div className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="font-body pl-10"
                />
              </div>
              <ScrollArea className="h-[450px]">
                {searchResults.map(u => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => startChat(u.id)}
                  >
                    <div className="relative">
                      <Avatar className="w-9 h-9">
                        {u.avatar_url && <AvatarImage src={u.avatar_url} />}
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">
                          {u.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot userId={u.id} /></span>
                    </div>
                    <div>
                      <p className="font-display text-sm font-medium text-foreground">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </motion.div>
                ))}
                {searchQuery.length >= 2 && searchResults.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8 font-body">No users found</p>
                )}
              </ScrollArea>
            </div>
          ) : (
            <ScrollArea className="h-full">
              {rooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mb-2 opacity-40" />
                  <p className="font-body text-sm">No conversations yet</p>
                  <p className="font-body text-xs">Start a new chat!</p>
                </div>
              ) : rooms.map(room => (
                <motion.div
                  key={room.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors"
                  onClick={() => setActiveRoom(room)}
                  whileHover={{ x: 4 }}
                >
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      {room.otherUser?.avatar_url && <AvatarImage src={room.otherUser.avatar_url} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                        {room.otherUser?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot userId={room.otherUser?.id} /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-sm font-semibold text-foreground truncate">
                        {room.otherUser?.full_name || "User"}
                      </p>
                      {room.lastMessageTime && (
                        <span className="text-[10px] text-muted-foreground font-body">{formatTime(room.lastMessageTime)}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate font-body">{room.lastMessage || "No messages yet"}</p>
                  </div>
                </motion.div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // Active chat
  return (
    <Card className="border-border h-[600px] flex flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setActiveRoom(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="relative">
            <Avatar className="w-8 h-8">
              {activeRoom.otherUser?.avatar_url && <AvatarImage src={activeRoom.otherUser.avatar_url} />}
              <AvatarFallback className="bg-primary/10 text-primary font-display text-xs">
                {activeRoom.otherUser?.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot userId={activeRoom.otherUser?.id} /></span>
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {activeRoom.otherUser?.full_name || "User"}
            </p>
            <p className="text-[10px] text-muted-foreground font-body flex items-center gap-1">
              {getPresenceStatus(activeRoom.otherUser?.id) === "online" ? "Online" :
               getPresenceStatus(activeRoom.otherUser?.id) === "idle" ? "Away" : "Offline"}
            </p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
              }`}>
                {msg.sender_id !== user?.id && (
                  <p className="text-xs font-display font-semibold mb-1 opacity-70">{msg.senderName}</p>
                )}
                {msg.media_url && (
                  <img src={msg.media_url} alt="attachment" className="rounded-lg max-w-full max-h-48 mb-2 cursor-pointer" onClick={() => window.open(msg.media_url!, "_blank")} />
                )}
                {msg.content && msg.content !== "📎 Attachment" && (
                  <p className="text-sm font-body">{msg.content}</p>
                )}
                <div className="flex items-center gap-1 justify-end mt-1">
                  <span className="text-[10px] opacity-60">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <ReadReceipt msg={msg} />
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        {mediaFile && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-lg">
            <Paperclip className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-body text-foreground truncate flex-1">{mediaFile.name}</span>
            <button onClick={() => setMediaFile(null)} className="text-xs text-destructive font-body">Remove</button>
          </div>
        )}
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => setMediaFile(e.target.files?.[0] || null)} />
          <Button size="icon" variant="ghost" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="w-4 h-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="font-body"
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          />
          <Button size="icon" onClick={sendMessage} disabled={(!newMessage.trim() && !mediaFile) || uploading}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatSystemV2;
