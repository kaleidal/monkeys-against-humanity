import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    'https://rhkaqeglfuxoyqrnrvhg.supabase.co', // your project URL
    'sb_publishable_yEBTX4BSoFUZwYhxlLyvWQ_SaqQaW82' // your anon key
);