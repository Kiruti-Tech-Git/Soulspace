import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Heart, Sparkles, Calendar, TrendingUp, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { analyticsService, userService } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
};

const affirmations = [
  "I am grateful for this beautiful day",
  "My heart is open to receiving abundance",
  "I choose peace and joy in this moment",
  "I am worthy of love and happiness",
  "Today I create something beautiful"
];

export default function Dashboard() {
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const userName = userProfile?.username || userProfile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Beautiful Soul"


 useEffect(() => {
  if (user) {
    loadDashboardData();
    loadUserProfile(); // ← this line was missing
  }
}, [user]);

  useEffect(() => {
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    setCurrentAffirmation(randomAffirmation);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const stats = await analyticsService.getDashboardStats();
      setDashboardStats(stats);
    } catch (error: any) {
      toast({
        title: "Failed to load dashboard data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const profile = await userService.getUserProfile();
      setUserProfile(profile);
    } catch (error: any) {
      console.error('Failed to load user profile:', error);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-soul-purple mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading your sanctuary...</p>
        </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {getGreeting()}, {userName}! ✨
        </h1>
        <p className="text-muted-foreground">Welcome to your sanctuary</p>
      </div>

      {/* Daily Affirmation */}
      <Card className="bg-gradient-primary text-white border-0 shadow-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-lg">Today's Affirmation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/90 font-medium italic">"{currentAffirmation}"</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/journal/new">
            <Button className="w-full h-24 flex-col gap-2 bg-soul-purple hover:bg-soul-purple/90 text-white shadow-soft">
              <Plus className="h-6 w-6" />
              <span className="text-sm">New Entry</span>
            </Button>
          </Link>
          <Link to="/mood">
            <Button variant="outline" className="w-full h-24 flex-col gap-2 border-soul-blue text-soul-blue hover:bg-soul-blue/10">
              <Heart className="h-6 w-6" />
              <span className="text-sm">Log Mood</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">Today's Summary</h2>
        {loading ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Loading your data...</p>
          </div>
        ) : (
          <div className="grid gap-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-soul-green/10 rounded-lg">
                  <FileText className="h-5 w-5 text-soul-green" />
                </div>
                <div>
                  <p className="font-medium">Journal Entries</p>
                  <p className="text-sm text-muted-foreground">{dashboardStats?.journalCount || 0} total entries</p>
                </div>
              </div>
              <Badge variant="secondary">{dashboardStats?.journalCount > 0 ? "Active" : "Start"}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-soul-orange/10 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-soul-orange" />
                </div>
                <div>
                  <p className="font-medium">Mood Check</p>
                  <p className="text-sm text-muted-foreground">{dashboardStats?.recentMood ? `Feeling ${dashboardStats.recentMood}` : "No mood logged"}</p>
                </div>
              </div>
              <Badge variant="secondary">{dashboardStats?.recentMood ? "Logged" : "Pending"}</Badge>
            </CardContent>
          </Card>
        </div>
        )}
      </div>

      {/* Weekly Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            This Week
          </CardTitle>
          <CardDescription>Your gratitude journey</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Journal Entries</span>
            <span className="font-semibold text-soul-purple">{dashboardStats?.journalCount || 0} entries</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Mood Average</span>
            <span className="font-semibold text-soul-green">{dashboardStats?.recentMood ? `${dashboardStats.recentMood} 😊` : "No data"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Streak</span>
            <span className="font-semibold text-soul-blue">{dashboardStats?.streak || 0} days</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}