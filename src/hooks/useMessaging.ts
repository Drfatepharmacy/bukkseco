import { useEffect, useState } from 'react';

const useMessaging = (conversationId) => {
    const [messages, setMessages] = useState([]);
    const [typingIndicators, setTypingIndicators] = useState([]);
    
    useEffect(() => {
        // Establish real-time connection and subscribe to messages
        const socket = new WebSocket(`wss://your-websocket-url/conversations/${conversationId}`);

        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (message.type === 'message') {
                setMessages(prevMessages => [...prevMessages, message.data]);
            } else if (message.type === 'typing') {
                setTypingIndicators(prevIndicators => [...prevIndicators, message.data]);
            } else if (message.type === 'read_receipt') {
                // Handle read receipts
            }
        };

        // Cleanup on unmount
        return () => {
            socket.close();
        };
    }, [conversationId]);

    const sendMessage = (messageContent) => {
        const socket = new WebSocket(`wss://your-websocket-url/conversations/${conversationId}`);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'message', content: messageContent }));
        };
    };

    const sendTypingIndicator = () => {
        const socket = new WebSocket(`wss://your-websocket-url/conversations/${conversationId}`);
        socket.onopen = () => {
            socket.send(JSON.stringify({ type: 'typing' }));
        };
    };

    return { messages, typingIndicators, sendMessage, sendTypingIndicator };
};

export default useMessaging;