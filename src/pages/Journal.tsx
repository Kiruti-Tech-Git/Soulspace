import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, Heart, Calendar, Image as ImageIcon, Edit, Trash2, Volume2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { journalService } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const moodColors = {
  happy: "bg-mood-happy",
  content: "bg-mood-content", 
  okay: "bg-mood-okay",
  sad: "bg-mood-sad",
  anxious: "bg-mood-anxious"
};

const moodEmojis = {
  happy: "😊",
  content: "😌",
  okay: "😐",
  sad: "😢",
  anxious: "😰"
};

export default function Journal() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user]);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         entry.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMood = !selectedMood || entry.mood === selectedMood;
    return matchesSearch && matchesMood;
  });

  const loadEntries = async () => {
    try {
      setLoading(true);
      const data = await journalService.getEntries();
      setEntries(data);
    } catch (error: any) {
      toast({
        title: "Failed to load entries",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: any) => {
    navigate('/journal/edit', { state: { entry } });
  };

  const handleDelete = async (entryId: string) => {
    try {
      setDeleteLoading(true);
      await journalService.deleteEntry(entryId);
      
      // Update local state
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
      setSelectedEntry(null);
      
      toast({
        title: "Entry deleted",
        description: "Your journal entry has been removed."
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete entry",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const playVoiceNote = (voiceNoteUrl: string) => {
    const audio = new Audio(voiceNoteUrl);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      toast({
        title: "Playback failed",
        description: "Could not play the voice note.",
        variant: "destructive"
      });
    });
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center">
        <p>Please sign in to access your journal.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-2xl font-semibold">Journal</h1>
          <p className="text-muted-foreground">Your gratitude entries</p>
        </div>
        <Link to="/journal/new">
          <Button size="sm" className="bg-soul-purple hover:bg-soul-purple/90 text-white shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your entries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-border/50 focus:border-soul-purple"
          />
        </div>

        {/* Mood Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={selectedMood === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedMood(null)}
            className="shrink-0 rounded-full"
          >
            All
          </Button>
          {Object.entries(moodEmojis).map(([mood, emoji]) => (
            <Button
              key={mood}
              variant={selectedMood === mood ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedMood(mood)}
              className="shrink-0 rounded-full"
            >
              {emoji} {mood}
            </Button>
          ))}
        </div>
      </div>

      {/* Entries List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading your entries...</p>
          </div>
        ) : (
          <>
        {filteredEntries.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-soul-purple-light rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Heart className="h-8 w-8 text-soul-purple" />
                </div>
                <h3 className="font-medium">No entries found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm || selectedMood
                    ? "Try adjusting your filters"
                    : "Start your gratitude journey today"}
                </p>
                <Link to="/journal/new">
                  <Button className="mt-4 bg-soul-purple hover:bg-soul-purple/90 text-white">
                    Create First Entry
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEntries.map((entry) => (
            <Dialog key={entry.id}>
              <DialogTrigger asChild>
                <Card 
                  className="hover:shadow-soft transition-all duration-200 cursor-pointer border border-border/50 hover:border-soul-purple/30"
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-medium mb-1">{entry.title}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(entry.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                      {/* Image Preview */}
                      {entry.images && entry.images.length > 0 && (
                        <div className="ml-4 flex-shrink-0">
                          <img
                            src={entry.images[0]}
                            alt="Journal entry preview"
                            className="w-16 h-16 object-cover rounded-md border border-border/50"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="flex text-lg">
                          {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-muted-foreground line-clamp-3">
                      {entry.content}
                    </p>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs rounded-full bg-soul-purple-light text-soul-purple">
                          #{tag}
                        </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DialogTrigger>
              
              <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-xl font-semibold flex-1 pr-2">{entry.title}</DialogTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(entry)}
                        className="p-2 hover:bg-soul-purple/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-destructive/10 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this journal entry? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.id)}
                              disabled={deleteLoading}
                              className="bg-destructive hover:bg-destructive/90"
                            >
                              {deleteLoading ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <DialogDescription className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {new Date(entry.created_at).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                    <span className="ml-2 text-lg">
                      {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                    </span>
                    <span className="capitalize">{entry.mood}</span>
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Content */}
                  <div>
                    <h4 className="font-medium mb-2">Your Thoughts</h4>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </p>
                  </div>

                  {/* Images */}
                  {entry.images && Array.isArray(entry.images) && entry.images.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Photos</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {entry.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={image}
                              alt={`Journal image ${index + 1}`}
                              className="w-full max-h-64 object-contain rounded-lg border bg-accent/20"
                              onError={(e) => {
                                console.error('Image failed to load:', image.substring(0, 50) + '...');
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Voice Note */}
                  {entry.voice_note && (
                    <div>
                      <h4 className="font-medium mb-2">Voice Note</h4>
                      <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playVoiceNote(entry.voice_note)}
                          className="p-2"
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">Click to play voice note</span>
                      </div>
                      <audio controls className="w-full mt-2" preload="none">
                        <source src={entry.voice_note} type="audio/webm" />
                        <source src={entry.voice_note} type="audio/wav" />
                        <source src={entry.voice_note} type="audio/mp3" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}

                  {/* Tags */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {entry.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="bg-soul-purple-light text-soul-purple">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))
        )}
          </>
        )}
      </div>
    </div>
  );
}