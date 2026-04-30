// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { Subscription } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Messaging subscription helper
export const subscribeToMessages = (callback: (message: any) => void): Subscription => {
    return supabase
        .from('messages')
        .on('*', callback)
        .subscribe();
};

// Receipts subscription helper
export const subscribeToReceipts = (callback: (receipt: any) => void): Subscription => {
    return supabase
        .from('receipts')
        .on('*', callback)
        .subscribe();
};

// Typing indicators subscription helper
export const subscribeToTypingIndicators = (callback: (indicator: any) => void): Subscription => {
    return supabase
        .from('typing_indicators')
        .on('*', callback)
        .subscribe();
};

// Order status subscription helper
export const subscribeToOrderStatus = (callback: (status: any) => void): Subscription => {
    return supabase
        .from('order_status')
        .on('*', callback)
        .subscribe();
};

// Wallet transactions subscription helper
export const subscribeToWalletTransactions = (callback: (transaction: any) => void): Subscription => {
    return supabase
        .from('wallet_transactions')
        .on('*', callback)
        .subscribe();
};
