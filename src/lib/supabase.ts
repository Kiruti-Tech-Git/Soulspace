import { supabase } from './supabaseClient';
import { Database } from '../database.types';

type JournalEntry = Database['public']['Tables']['journal_entries']['Row'];
type JournalEntryInsert = Database['public']['Tables']['journal_entries']['Insert'];
type MoodLog = Database['public']['Tables']['mood_logs']['Row'];
type MoodLogInsert = Database['public']['Tables']['mood_logs']['Insert'];
type VisionBoard = Database['public']['Tables']['vision_boards']['Row'];
type VisionBoardInsert = Database['public']['Tables']['vision_boards']['Insert'];
type VisionBoardItem = Database['public']['Tables']['vision_board_items']['Row'];
type VisionBoardItemInsert = Database['public']['Tables']['vision_board_items']['Insert'];
type UserProfile = Database['public']['Tables']['users']['Row'];
type UserProfileUpdate = Database['public']['Tables']['users']['Update'];

// Journal Entry Functions
export const journalService = {
  // Create a new journal entry
  async createEntry(entry: Omit<JournalEntryInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        ...entry,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all journal entries for the current user
  async getEntries() {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get a single journal entry by ID
  async getEntryById(id: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update a journal entry
  async updateEntry(id: string, updates: Partial<Omit<JournalEntryInsert, 'user_id' | 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('journal_entries')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a journal entry
  async deleteEntry(id: string) {
    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Search entries
  async searchEntries(query: string) {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// Mood Log Functions
export const moodService = {
  // Create or update mood log for a specific date
  async logMood(mood: Omit<MoodLogInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('mood_logs')
      .upsert({
        ...mood,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get mood logs for a date range
  async getMoodLogs(startDate?: string, endDate?: string) {
    let query = supabase
      .from('mood_logs')
      .select('*')
      .order('log_date', { ascending: false });

    if (startDate) {
      query = query.gte('log_date', startDate);
    }
    if (endDate) {
      query = query.lte('log_date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get mood insights
  async getMoodInsights(days: number = 30) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('mood, log_date')
      .gte('log_date', startDate.toISOString().split('T')[0])
      .lte('log_date', endDate.toISOString().split('T')[0])
      .order('log_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  // Delete mood log
  async deleteMoodLog(id: string) {
    const { error } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Vision Board Functions
export const visionBoardService = {
  // Create a new vision board
  async createBoard(board: Omit<VisionBoardInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('vision_boards')
      .insert({
        ...board,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all vision boards for the current user
  async getBoards() {
    const { data, error } = await supabase
      .from('vision_boards')
      .select(`
        *,
        vision_board_items (*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update a vision board
  async updateBoard(id: string, updates: Partial<Omit<VisionBoardInsert, 'user_id' | 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('vision_boards')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a vision board
  async deleteBoard(id: string) {
    const { error } = await supabase
      .from('vision_boards')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Add item to vision board
  async addItem(item: Omit<VisionBoardItemInsert, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('vision_board_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get items for a specific board
  async getBoardItems(boardId: string) {
    const { data, error } = await supabase
      .from('vision_board_items')
      .select('*')
      .eq('board_id', boardId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Update vision board item
  async updateItem(id: string, updates: Partial<Omit<VisionBoardItemInsert, 'id' | 'created_at'>>) {
    const { data, error } = await supabase
      .from('vision_board_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete vision board item
  async deleteItem(id: string) {
    const { error } = await supabase
      .from('vision_board_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// File Upload Functions
export const storageService = {
  // Convert image file to base64 data URL for temporary storage
  async uploadImage(file: File, bucket?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(`File ${file.name} is too large. Maximum size is 5MB.`));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        reject(new Error(`File ${file.name} is not an image.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });
  },

  // Convert voice note blob to base64 data URL for temporary storage
  async uploadVoiceNote(blob: Blob, bucket?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read voice note'));
      };
      reader.readAsDataURL(blob);
    });
  },

  // Delete file
  async deleteFile(fileName: string, bucket?: string) {
    // For base64 data URLs, no deletion needed
    return Promise.resolve();
  },

  // Get public URL for file
  getPublicUrl(fileName: string, bucket?: string): string {
    // For base64 data URLs, return as-is
    return fileName;
  },
};

// Add file size constant
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Dashboard Analytics Functions
export const analyticsService = {
  // Get dashboard stats
  async getDashboardStats() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get journal entries count
    const { count: journalCount } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true });

    // Get mood logs count
    const { count: moodCount } = await supabase
      .from('mood_logs')
      .select('*', { count: 'exact', head: true });

    // Get vision boards count
    const { count: visionBoardCount } = await supabase
      .from('vision_boards')
      .select('*', { count: 'exact', head: true });

    // Get recent mood
    const { data: recentMood } = await supabase
      .from('mood_logs')
      .select('mood, log_date')
      .order('log_date', { ascending: false })
      .limit(1);

    // Get streak (consecutive days with journal entries)
    const { data: recentEntries } = await supabase
      .from('journal_entries')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(30);

    let streak = 0;
    if (recentEntries && recentEntries.length > 0) {
      const today = new Date();
      const dates = recentEntries.map(entry => 
        new Date(entry.created_at).toDateString()
      );
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        
        if (dates.includes(checkDate.toDateString())) {
          streak++;
        } else {
          break;
        }
      }
    }

    return {
      journalCount: journalCount || 0,
      moodCount: moodCount || 0,
      visionBoardCount: visionBoardCount || 0,
      recentMood: recentMood?.[0]?.mood || null,
      streak,
    };
  },

  // Get weekly mood insights
  async getWeeklyMoodInsights() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const { data, error } = await supabase
      .from('mood_logs')
      .select('mood, log_date')
      .gte('log_date', startDate.toISOString().split('T')[0])
      .lte('log_date', endDate.toISOString().split('T')[0])
      .order('log_date', { ascending: true });

    if (error) throw error;
    return data;
  },
};

// User Profile Functions
export const userService = {
  // Get current user's profile
  async getUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateUserProfile(updates: Partial<UserProfileUpdate>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};