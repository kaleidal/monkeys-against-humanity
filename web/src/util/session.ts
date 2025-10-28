import { writable } from 'svelte/store';
import type { User } from '@supabase/supabase-js';

export interface Session {
    user: User | null;       // Supabase user
}

export const session = writable<Session>({ user: null });
