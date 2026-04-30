// src/types/messaging.ts

// Define all messaging entities

type Message = {
    id: string; // Unique identifier for the message
    senderId: string; // User ID of the message sender
    receiverId: string; // User ID of the message receiver
    content: string; // Message content
    timestamp: Date; // When the message was sent
    status: 'sent' | 'delivered' | 'read'; // Message status
};

export type { Message };