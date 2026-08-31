import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbhcujnyapkjfnvgpdtx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiaGN1am55YXBramZudmdwZHR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgxMzc0MjQsImV4cCI6MjEwMzcxMzQyNH0.ofjVDwlp9uBbZJbJTxjou_KqmKW7apRkS0T_yijXe0M';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
