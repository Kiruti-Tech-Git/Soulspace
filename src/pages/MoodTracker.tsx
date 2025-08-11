import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { TrendingUp, Calendar as CalendarIcon, BarChart3, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { moodService } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const moodOptions = [
  { value: "happy", emoji: "😊", label: "Happy", color: "bg-mood-happy" },
  { value: "content", emoji: "😌", label: "Content", color: "bg-mood-content" },
  { value: "okay", emoji: "😐", label: "Okay", color: "bg-mood-okay" },
  { value: "sad", emoji: "😢", label: "Sad", color: "bg-mood-sad" },
  { value: "anxious", emoji: "😰", label: "Anxious", color: "bg-mood-anxious" }
];

export default function MoodTracker() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedMood, setSelectedMood] = useState("");
  const [moodNote, setMoodNote] = useState("");
  const [viewMode, setViewMode] = useState<"log" | "calendar" | "chart">("log");
  const [moodData, setMoodData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadMoodData();
    }
  }, [user]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayMood = moodData.find(entry => entry.log_date === today);

  const getMoodStats = () => {
    const moodCounts = moodData.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalEntries = moodData.length;
    return moodOptions.map(mood => ({
      ...mood,
      count: moodCounts[mood.value] || 0,
      percentage: totalEntries > 0 ? ((moodCounts[mood.value] || 0) / totalEntries * 100).toFixed(0) : "0"
    }));
  };

  const getStreakInfo = () => {
    // Calculate current streak
    const sortedDates = moodData
      .map(entry => new Date(entry.log_date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < sortedDates.length; i++) {
      const diffDays = Math.floor((today.getTime() - sortedDates[i].getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === i) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const loadMoodData = async () => {
    try {
      setLoading(true);
      const data = await moodService.getMoodLogs();
      setMoodData(data);
    } catch (error: any) {
      toast({
        title: "Failed to load mood data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoodLog = async () => {
    if (!selectedMood) {
      toast({
        title: "Please select a mood",
        description: "Choose how you're feeling today.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      const moodLog = await moodService.logMood({
        log_date: today,
        mood: selectedMood,
        note: moodNote.trim() || null,
      });

      // Update local state
      setMoodData(prev => {
        const filtered = prev.filter(entry => entry.log_date !== today);
        return [moodLog, ...filtered].sort((a, b) => 
          new Date(b.log_date).getTime() - new Date(a.log_date).getTime()
        );
      });

      setSelectedMood("");
      setMoodNote("");
      
      toast({
        title: "Mood logged! 💫",
        description: "Your emotional check-in has been saved."
      });
    } catch (error: any) {
      toast({
        title: "Failed to log mood",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center">
        <p>Please sign in to track your mood.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center">
        <p>Loading your mood data...</p>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold mb-2">Mood Tracker</h1>
        <p className="text-muted-foreground">Track your emotional journey</p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === "log" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("log")}
          className={viewMode === "log" ? "bg-soul-purple hover:bg-soul-purple/90" : ""}
        >
          <Plus className="h-4 w-4 mr-2" />
          Log Mood
        </Button>
        <Button
          variant={viewMode === "calendar" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("calendar")}
          className={viewMode === "calendar" ? "bg-soul-purple hover:bg-soul-purple/90" : ""}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          Calendar
        </Button>
        <Button
          variant={viewMode === "chart" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("chart")}
          className={viewMode === "chart" ? "bg-soul-purple hover:bg-soul-purple/90" : ""}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Insights
        </Button>
      </div>

      {/* Today's Status */}
      <Card className="bg-gradient-calm border-0">
        <CardHeader>
          <CardTitle className="text-lg">Today's Mood</CardTitle>
          <CardDescription>
            {todayMood ? "You've logged your mood today!" : "How are you feeling today?"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayMood ? (
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {moodOptions.find(m => m.value === todayMood.mood)?.emoji}
              </span>
              <div>
                <p className="font-medium capitalize">{todayMood.mood}</p>
                <p className="text-sm text-muted-foreground">{todayMood.note}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No mood logged yet today</p>
          )}
        </CardContent>
      </Card>

      {/* Content based on view mode */}
      {viewMode === "log" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Your Mood</CardTitle>
            <CardDescription>How are you feeling right now?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.value}
                  variant={selectedMood === mood.value ? "default" : "outline"}
                  onClick={() => setSelectedMood(mood.value)}
                  className={`flex-col h-20 ${
                    selectedMood === mood.value 
                      ? "bg-soul-purple hover:bg-soul-purple/90 text-white" 
                      : "hover:bg-soul-purple/10"
                  }`}
                >
                  <span className="text-2xl">{mood.emoji}</span>
                  <span className="text-xs">{mood.label}</span>
                </Button>
              ))}
            </div>
            
            {selectedMood && (
              <div className="space-y-3">
                <textarea
                  placeholder="Add a note about your mood (optional)..."
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border/50 focus:border-soul-purple focus:outline-none resize-none"
                  rows={3}
                />
                <Button 
                  onClick={handleMoodLog}
                  className="w-full bg-soul-purple hover:bg-soul-purple/90 text-white"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Log Mood"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === "calendar" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mood Calendar</CardTitle>
            <CardDescription>View your mood history</CardDescription>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full"
            />
            
            {/* Recent entries */}
            <div className="mt-6 space-y-3">
              <h4 className="font-medium">Recent Entries</h4>
              {moodData.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {moodOptions.find(m => m.value === entry.mood)?.emoji}
                    </span>
                    <div>
                      <p className="font-medium capitalize">{entry.mood}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(entry.log_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {entry.note && (
                    <p className="text-sm text-muted-foreground max-w-32 truncate">
                      {entry.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {viewMode === "chart" && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Mood Insights
              </CardTitle>
              <CardDescription>Your emotional patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <Badge variant="secondary" className="bg-soul-purple-light text-soul-purple">
                  {getStreakInfo()} days
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Entries</span>
                <span className="font-semibold">{moodData.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Week</span>
                <span className="font-semibold">{moodData.filter(entry => {
                  const entryDate = new Date(entry.log_date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return entryDate >= weekAgo;
                }).length} entries</span>
              </div>
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mood Distribution</CardTitle>
              <CardDescription>How you've been feeling lately</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {getMoodStats().map((mood) => (
                <div key={mood.value} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{mood.emoji}</span>
                      <span className="font-medium capitalize">{mood.label}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{mood.percentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${mood.color}`}
                      style={{ width: `${mood.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}