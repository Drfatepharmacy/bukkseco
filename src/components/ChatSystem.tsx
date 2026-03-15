import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Search, ArrowLeft, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSoundNotification } from "@/hooks/useSoundNotification";

interface ChatRoom {
  id: string;
  type: string;
  name: string | null;
  created_at: string;
  lastMessage?: string;
  otherUser?: { full_name: string; email: string };
}

interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  senderName?: string;
}

const ChatSystem = () => {
  const { user } = useAuth();
  const { playSound } = useSoundNotification();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat rooms
  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      const { data: participations } = await supabase
        .from("chat_participants")
        .select("room_id")
        .eq("user_id", user.id);
      
      if (!participations?.length) return;

      const roomIds = participations.map((p) => p.room_id);
      const { data: roomData } = await supabase
        .from("chat_rooms")
        .select("*")
        .in("id", roomIds);
      
      if (roomData) {
        // Get other participants' info
        const enrichedRooms = await Promise.all(
          roomData.map(async (room) => {
            const { data: participants } = await supabase
              .from("chat_participants")
              .select("user_id")
              .eq("room_id", room.id)
              .neq("user_id", user.id);
            
            let otherUser;
            if (participants?.[0]) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", participants[0].user_id)
                .single();
              otherUser = profile;
            }

            // Get last message
            const { data: lastMsg } = await supabase
              .from("chat_messages")
              .select("content")
              .eq("room_id", room.id)
              .order("created_at", { ascending: false })
              .limit(1);
            
            return {
              ...room,
              otherUser: otherUser || undefined,
              lastMessage: lastMsg?.[0]?.content,
            };
          })
        );
        setRooms(enrichedRooms);
      }
    };
    fetchRooms();
  }, [user]);

  // Fetch messages for active room
  useEffect(() => {
    if (!activeRoom) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("room_id", activeRoom.id)
        .order("created_at", { ascending: true });
      
      if (data) {
        // Enrich with sender names
        const senderIds = [...new Set(data.map((m) => m.sender_id))];
        const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", senderIds);
        const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.full_name]));
        
        setMessages(data.map((m) => ({ ...m, senderName: profileMap[m.sender_id] || "Unknown" })));
      }
    };
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${activeRoom.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `room_id=eq.${activeRoom.id}` }, async (payload) => {
        const msg = payload.new as ChatMessage;
        if (msg.sender_id !== user?.id) {
          playSound("chat");
        }
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", msg.sender_id).single();
        setMessages((prev) => [...prev, { ...msg, senderName: profile?.full_name || "Unknown" }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || !user) return;
    await supabase.from("chat_messages").insert({
      room_id: activeRoom.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage("");
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .neq("id", user?.id || "")
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const startChat = async (otherUserId: string) => {
    if (!user) return;
    // Check if room exists
    const { data: myRooms } = await supabase.from("chat_participants").select("room_id").eq("user_id", user.id);
    if (myRooms) {
      for (const r of myRooms) {
        const { data: otherParticipant } = await supabase
          .from("chat_participants")
          .select("user_id")
          .eq("room_id", r.room_id)
          .eq("user_id", otherUserId)
          .single();
        if (otherParticipant) {
          // Room exists, open it
          const existing = rooms.find((rm) => rm.id === r.room_id);
          if (existing) { setActiveRoom(existing); setShowNewChat(false); return; }
        }
      }
    }

    // Create new room
    const { data: room } = await supabase.from("chat_rooms").insert({ type: "direct" as any }).select().single();
    if (room) {
      await supabase.from("chat_participants").insert([
        { room_id: room.id, user_id: user.id },
        { room_id: room.id, user_id: otherUserId },
      ]);
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", otherUserId).single();
      const newRoom: ChatRoom = { ...room, otherUser: profile || undefined };
      setRooms((prev) => [newRoom, ...prev]);
      setActiveRoom(newRoom);
      setShowNewChat(false);
    }
  };

  // Chat room list view
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
              <Input
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => searchUsers(e.target.value)}
                className="font-body"
              />
              <ScrollArea className="h-[450px]">
                {searchResults.map((u) => (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => startChat(u.id)}
                  >
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-display">
                        {u.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-display text-sm font-medium text-foreground">{u.full_name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </motion.div>
                ))}
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
              ) : (
                rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    className="flex items-center gap-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 transition-colors"
                    onClick={() => setActiveRoom(room)}
                    whileHover={{ x: 4 }}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-display text-sm">
                        {room.otherUser?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold text-foreground truncate">
                        {room.otherUser?.full_name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{room.lastMessage || "No messages yet"}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    );
  }

  // Active chat view
  return (
    <Card className="border-border h-[600px] flex flex-col">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Button size="icon" variant="ghost" onClick={() => setActiveRoom(null)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary font-display text-xs">
              {activeRoom.otherUser?.full_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-display text-sm font-semibold text-foreground">
              {activeRoom.otherUser?.full_name || "User"}
            </p>
            <p className="text-xs text-muted-foreground">{activeRoom.otherUser?.email}</p>
          </div>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender_id === user?.id ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender_id === user?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>
                {msg.sender_id !== user?.id && (
                  <p className="text-xs font-display font-semibold mb-1 opacity-70">{msg.senderName}</p>
                )}
                <p className="text-sm font-body">{msg.content}</p>
                <p className="text-[10px] opacity-60 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="font-body"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button size="icon" onClick={sendMessage} disabled={!newMessage.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatSystem;
