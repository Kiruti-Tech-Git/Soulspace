import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  User, 
  Bell, 
  Moon, 
  Sun, 
  Download, 
  Cloud, 
  Shield, 
  Settings, 
  Heart,
  Calendar,
  TrendingUp,
  BookOpen,
  Edit3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { analyticsService, userService } from "@/lib/supabase";
import { useTheme } from "next-themes";

export default function Profile() {
  const { user } = useSupabaseAuth();
  const { theme, setTheme } = useTheme();
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileUsername, setProfileUsername] = useState("");
  const [profileFullName, setProfileFullName] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyInsights: true,
    motivationalQuotes: false
  });
  const [privacy, setPrivacy] = useState({
    localLock: false,
    cloudBackup: true
  });
  const { toast } = useToast();

  const userName = userProfile?.username || userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Beautiful Soul";
  const userEmail = user?.email || "soul@example.com";
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadUserProfile();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const stats = await analyticsService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile();
      setUserProfile(profile);
      setProfileFullName(profile?.full_name || "");
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await userService.updateUserProfile({
        full_name: profileFullName
      });
      
      // Reload profile data
      await loadUserProfile();
      setEditingProfile(false);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setTheme(newTheme);
    toast({
      title: isDarkMode ? "Light mode enabled" : "Dark mode enabled",
      description: "Your theme preference has been updated."
    });
  };

  const handleExportData = () => {
    toast({
      title: "Export started",
      description: "Your data is being prepared for download."
    });
  };

  const userStats = [
    { label: "Journal Entries", value: dashboardStats?.journalCount?.toString() || "0", icon: BookOpen, color: "text-soul-purple" },
    { label: "Day Streak", value: dashboardStats?.streak?.toString() || "0", icon: Calendar, color: "text-soul-green" },
    { label: "Mood Logs", value: dashboardStats?.moodCount?.toString() || "0", icon: Heart, color: "text-soul-pink" },
    { label: "Vision Boards", value: dashboardStats?.visionBoardCount?.toString() || "0", icon: TrendingUp, color: "text-soul-blue" }
  ];

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold mb-2">Profile</h1>
        <p className="text-muted-foreground">Your sanctuary settings</p>
      </div>

      {/* User Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingProfile(!editingProfile)}
              className="hover:bg-soul-purple/10"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {editingProfile ? "Cancel" : "Edit"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-primary text-white text-xl font-medium">
                {userName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            {editingProfile ? (
              <div className="flex-1 space-y-3">
                <div>
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value)}
                    placeholder="Enter your username"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="fullname" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullname"
                    value={profileFullName}
                    onChange={(e) => setProfileFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpdateProfile}
                    size="sm"
                    className="bg-soul-purple hover:bg-soul-purple/90 text-white"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingProfile(false);
                      setProfileFullName(userProfile?.full_name || "");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{userName}</h3>
                <p className="text-muted-foreground">{userEmail}</p>
                <Badge variant="secondary" className="mt-2 bg-soul-purple-light text-soul-purple">
                  Gratitude Seeker ✨
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Journey</CardTitle>
          <CardDescription>Your progress in numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {userStats.map((stat, index) => (
              <div key={index} className="text-center p-3 bg-accent/50 rounded-lg">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                <Moon className="h-5 w-5 text-soul-blue" />
              ) : (
                <Sun className="h-5 w-5 text-soul-orange" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  Switch to dark theme
                </p>
              </div>
            </div>
            <Switch
              checked={isDarkMode}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Customize your reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Reminder</p>
              <p className="text-sm text-muted-foreground">
                Remind me to journal daily
              </p>
            </div>
            <Switch
              checked={notifications.dailyReminder}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, dailyReminder: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Insights</p>
              <p className="text-sm text-muted-foreground">
                Get weekly mood insights
              </p>
            </div>
            <Switch
              checked={notifications.weeklyInsights}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, weeklyInsights: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Motivational Quotes</p>
              <p className="text-sm text-muted-foreground">
                Random affirmations
              </p>
            </div>
            <Switch
              checked={notifications.motivationalQuotes}
              onCheckedChange={(checked) => 
                setNotifications(prev => ({ ...prev, motivationalQuotes: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy & Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Local Lock</p>
              <p className="text-sm text-muted-foreground">
                Require passcode to open app
              </p>
            </div>
            <Switch
              checked={privacy.localLock}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, localLock: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Cloud Backup</p>
              <p className="text-sm text-muted-foreground">
                Sync your data securely
              </p>
            </div>
            <Switch
              checked={privacy.cloudBackup}
              onCheckedChange={(checked) => 
                setPrivacy(prev => ({ ...prev, cloudBackup: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Data Management</CardTitle>
          <CardDescription>Export and backup your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-soul-purple/10"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as PDF
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-soul-purple/10"
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export as JSON
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start hover:bg-soul-purple/10"
          >
            <Cloud className="h-4 w-4 mr-2" />
            Backup to Cloud
          </Button>
        </CardContent>
      </Card>

      {/* About */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Soulspace</h3>
            <p className="text-muted-foreground text-sm">
              Your digital sanctuary for gratitude and mindfulness
            </p>
            <p className="text-xs text-muted-foreground">Version 1.0.0</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}