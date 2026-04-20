import { format } from "date-fns";
import { Check, CheckCheck, FileIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read_at?: string | null;
    media_url?: string | null;
  };
  otherUserName: string;
  isPrivacyRestricted: boolean;
}

export const MessageBubble = ({ message, otherUserName, isPrivacyRestricted }: MessageBubbleProps) => {
  const { user: currentUser } = useAuth();
  const isMe = message.sender_id === currentUser?.id;
  const isRead = !!message.read_at;

  const displayName = isMe ? "You" : (isPrivacyRestricted ? `User ${message.sender_id.slice(0, 6)}` : otherUserName);

  return (
    <div className={`flex flex-col mb-4 ${isMe ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{displayName}</span>
        <span className="text-[10px] text-muted-foreground">
          {format(new Date(message.created_at), "HH:mm")}
        </span>
      </div>

      <div
        className={`relative max-w-[80%] px-4 py-2 rounded-2xl ${
          isMe
            ? "bg-primary text-primary-foreground rounded-tr-none"
            : "bg-muted text-foreground rounded-tl-none"
        }`}
      >
        {message.media_url && (
          <div className="mb-2">
            {message.media_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || message.content === "📎 Attachment" ? (
              <img
                src={message.media_url}
                alt="Attachment"
                className="max-w-full rounded-lg cursor-pointer"
                onClick={() => window.open(message.media_url!, '_blank')}
              />
            ) : (
              <a
                href={message.media_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 bg-background/20 rounded-lg hover:bg-background/30 transition-colors"
              >
                <FileIcon className="h-4 w-4" />
                <span className="text-xs truncate">Download Attachment</span>
              </a>
            )}
          </div>
        )}

        {message.content && message.content !== "📎 Attachment" && <p className="text-sm whitespace-pre-wrap">{message.content}</p>}

        {isMe && (
          <div className="absolute -bottom-4 right-0">
            {isRead ? (
              <CheckCheck className="h-3 w-3 text-purple-500" />
            ) : (
              <Check className="h-3 w-3 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
