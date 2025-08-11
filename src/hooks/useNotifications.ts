import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

export interface NotificationSettings {
  dailyReminder: boolean;
  reminderTime: string;
  weeklyInsights: boolean;
  motivationalQuotes: boolean;
  quoteInterval: number; // minutes
}

const DEFAULT_SETTINGS: NotificationSettings = {
  dailyReminder: true,
  reminderTime: "20:00",
  weeklyInsights: true,
  motivationalQuotes: false,
  quoteInterval: 120
};

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const { toast } = useToast();

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('soulspace-notifications');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check current permission
    setPermission(Notification.permission);
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications enabled",
          description: "You'll receive gentle reminders to journal."
        });
      } else {
        toast({
          title: "Notifications disabled",
          description: "You can enable them later in settings.",
          variant: "destructive"
        });
      }
      
      return result;
    }
    return 'denied';
  }, [toast]);

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('soulspace-notifications', JSON.stringify(updated));
  }, [settings]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }, [permission]);

  const scheduleDailyReminder = useCallback(() => {
    if (!settings.dailyReminder || permission !== 'granted') return;

    const now = new Date();
    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilReminder = scheduledTime.getTime() - now.getTime();

    setTimeout(() => {
      showNotification("Time for gratitude 🌟", {
        body: "Take a moment to reflect on what you're grateful for today.",
        tag: "daily-reminder"
      });

      // Schedule next day
      scheduleDailyReminder();
    }, timeUntilReminder);
  }, [settings.dailyReminder, settings.reminderTime, permission, showNotification]);

  const scheduleMotivationalQuotes = useCallback(() => {
    if (!settings.motivationalQuotes || permission !== 'granted') return;

    const quotes = [
      "You are exactly where you need to be. 💫",
      "Your journey is beautiful and unique. 🌸",
      "Gratitude transforms ordinary days into magic. ✨",
      "You have the power to create your reality. 🌟",
      "Every breath is a gift, every moment a blessing. 🙏"
    ];

    const interval = setInterval(() => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      showNotification("A gentle reminder", {
        body: randomQuote,
        tag: "motivational-quote"
      });
    }, settings.quoteInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [settings.motivationalQuotes, settings.quoteInterval, permission, showNotification]);

  useEffect(() => {
    if (permission === 'granted') {
      scheduleDailyReminder();
      const cleanup = scheduleMotivationalQuotes();
      return cleanup;
    }
  }, [permission, scheduleDailyReminder, scheduleMotivationalQuotes]);

  const sendWeeklyInsight = useCallback((entriesCount: number, averageMood: string) => {
    if (!settings.weeklyInsights || permission !== 'granted') return;

    showNotification("Your weekly insight 📊", {
      body: `This week: ${entriesCount} entries, feeling mostly ${averageMood}. Keep nurturing your soul! 🌱`,
      tag: "weekly-insight"
    });
  }, [settings.weeklyInsights, permission, showNotification]);

  return {
    settings,
    permission,
    requestPermission,
    updateSettings,
    showNotification,
    sendWeeklyInsight
  };
}