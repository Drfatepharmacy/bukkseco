// src/lib/api-client.ts

import { createClient } from '@supabase/supabase-js';

// Define types for tenant support, authentication, messaging, and conversations
interface TenantConfig {
    tenantId: string;
    // additional tenant properties can be added here
}

interface User {
    id: string;
    email: string;
    // additional user properties can be added here
}

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
}

interface Conversation {
    id: string;
    participants: string[];
    lastMessage: Message;
    // additional conversation properties can be added here
}

class ApiClient {
    private supabase = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');
    private tenantConfig: TenantConfig;

    constructor(tenantConfig: TenantConfig) {
        this.tenantConfig = tenantConfig;
    }

    // Authentication Methods
    async signUp(email: string, password: string): Promise<User | null> {
        const { user, error } = await this.supabase.auth.signUp({ email, password });
        if (error) {
            this.handleError(error);
            return null;
        }
        return user;
    }

    async signIn(email: string, password: string): Promise<User | null> {
        const { user, error } = await this.supabase.auth.signIn({ email, password });
        if (error) {
            this.handleError(error);
            return null;
        }
        return user;
    }

    async signOut(): Promise<void> {
        const { error } = await this.supabase.auth.signOut();
        if (error) {
            this.handleError(error);
        }
    }

    // Messaging Methods
    async sendMessage(receiverId: string, content: string): Promise<Message | null> {
        const { data, error } = await this.supabase
            .from('messages')
            .insert([{ receiver_id: receiverId, content, sender_id: this.supabase.auth.user()?.id }]);
        if (error) {
            this.handleError(error);
            return null;
        }
        return data[0];
    }

    async receiveMessages(conversationId: string): Promise<Message[]> {
        const { data, error } = await this.supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId);
        if (error) {
            this.handleError(error);
            return [];
        }
        return data;
    }

    // Conversation Methods
    async startConversation(participantIds: string[]): Promise<Conversation | null> {
        const { data, error } = await this.supabase
            .from('conversations')
            .insert([{ participants: participantIds }]);
        if (error) {
            this.handleError(error);
            return null;
        }
        return data[0];
    }

    async listConversations(): Promise<Conversation[]> {
        const { data, error } = await this.supabase
            .from('conversations')
            .select('*');
        if (error) {
            this.handleError(error);
            return [];
        }
        return data;
    }

    // Error Handling
    private handleError(error: any): void {
        console.error('API Error:', error.message);
        // Implement further error handling strategies here as needed
    }
}

export default ApiClient;