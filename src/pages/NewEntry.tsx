import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, X, Image as ImageIcon, Mic, Sparkles, Upload, Trash2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { journalService, storageService } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";

const moodOptions = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "content", emoji: "😌", label: "Content" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "anxious", emoji: "😰", label: "Anxious" }
];

const availableTags = [
  "family", "love", "nature", "work", "health", "friendship", 
  "achievement", "peace", "growth", "gratitude", "morning", "evening"
];

const todaysAffirmation = "I am grateful for this beautiful day and all the opportunities it brings.";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
export default function NewEntry() {
  const location = useLocation();
  const editEntry = location.state?.entry;
  const isEditing = !!editEntry;

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [voiceNoteUrl, setVoiceNoteUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { isRecording, recordings, startRecording, stopRecording } = useAudioRecorder();

  // Populate form when editing
  useEffect(() => {
    if (isEditing && editEntry) {
      setTitle(editEntry.title || "");
      setContent(editEntry.content || "");
      setSelectedMood(editEntry.mood || "");
      setSelectedTags(editEntry.tags || []);
      setUploadedImages(editEntry.images || []);
      setVoiceNoteUrl(editEntry.voice_note || "");
    }
  }, [isEditing, editEntry]);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    if (customTag.trim() && !selectedTags.includes(customTag.trim())) {
      setSelectedTags(prev => [...prev, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || !selectedMood) {
      toast({
        title: "Please complete all fields",
        description: "Title, content, and mood are required.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const entryData = {
        title: title.trim(),
        content: content.trim(),
        mood: selectedMood,
        tags: selectedTags,
        images: uploadedImages,
        voice_note: voiceNoteUrl || null,
      };

      if (isEditing) {
        // Update existing entry
        await journalService.updateEntry(editEntry.id, entryData);
        toast({
          title: "Entry updated! ✨",
          description: "Your journal entry has been saved."
        });
      } else {
        // Create new entry
        await journalService.createEntry(entryData);
        toast({
          title: "Entry saved! ✨",
          description: "Your gratitude has been captured."
        });
      }

      navigate("/journal");
    } catch (error: any) {
      toast({
        title: isEditing ? "Failed to update entry" : "Failed to save entry",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
        }
        
        if (!file.type.startsWith('image/')) {
          throw new Error(`File ${file.name} is not an image.`);
        }

        return await storageService.uploadImage(file, 'journalimages');
      });

      const imageUrls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...imageUrls]);
      
      toast({
        title: "Images uploaded!",
        description: `${imageUrls.length} image(s) added to your entry.`
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      await startRecording();
    }
  };

  const handleSaveVoiceNote = async (recording: any) => {
    try {
      const voiceUrl = await storageService.uploadVoiceNote(recording.blob, 'voice_notes');
      setVoiceNoteUrl(voiceUrl);
      
      toast({
        title: "Voice note saved!",
        description: "Your voice note has been attached to this entry."
      });
    } catch (error: any) {
      toast({
        title: "Failed to save voice note",
        description: error.message,
        variant: "destructive"
      });
    }
  };


  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 pt-4">
        <Link to="/journal">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{isEditing ? "Edit Entry" : "New Entry"}</h1>
          <p className="text-muted-foreground text-sm">{isEditing ? "Update your thoughts" : "Capture your gratitude"}</p>
        </div>
        <Button 
          onClick={handleSave}
          className="bg-soul-purple hover:bg-soul-purple/90 text-white shadow-soft"
          size="sm"
          disabled={isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save")}
        </Button>
      </div>

      {/* Today's Affirmation */}
      {!isEditing && (
        <Card className="bg-gradient-primary text-white border-0">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            <CardTitle className="text-sm">Today's Affirmation</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/90 text-sm italic">"{todaysAffirmation}"</p>
        </CardContent>
      </Card>
      )}

      {/* Entry Form */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-sm font-medium mb-2 block">Title</label>
          <Input
            placeholder="What are you grateful for today?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="rounded-xl border-border/50 focus:border-soul-purple"
          />
        </div>

        {/* Content */}
        <div>
          <label className="text-sm font-medium mb-2 block">Your Thoughts</label>
          <Textarea
            placeholder="Describe what made you feel grateful today. Let your heart speak..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-32 rounded-xl border-border/50 focus:border-soul-purple resize-none"
          />
        </div>

        {/* Mood Selection */}
        <div>
          <label className="text-sm font-medium mb-3 block">How are you feeling?</label>
          <div className="grid grid-cols-3 gap-2">
            {moodOptions.map((mood) => (
              <Button
                key={mood.value}
                variant={selectedMood === mood.value ? "default" : "outline"}
                onClick={() => setSelectedMood(mood.value)}
                className={`flex-col h-16 ${
                  selectedMood === mood.value 
                    ? "bg-soul-purple hover:bg-soul-purple/90 text-white" 
                    : "hover:bg-soul-purple/10"
                }`}
              >
                <span className="text-xl">{mood.emoji}</span>
                <span className="text-xs">{mood.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-3 block">Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className={`cursor-pointer transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-soul-purple hover:bg-soul-purple/90 text-white"
                    : "hover:bg-soul-purple/10 hover:border-soul-purple"
                }`}
                onClick={() => handleTagToggle(tag)}
              >
                #{tag}
              </Badge>
            ))}
          </div>
          
          {/* Custom Tag Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add custom tag..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              className="rounded-xl border-border/50 focus:border-soul-purple"
              onKeyPress={(e) => e.key === 'Enter' && handleAddCustomTag()}
            />
            <Button 
              onClick={handleAddCustomTag}
              variant="outline" 
              size="sm"
              className="shrink-0 hover:bg-soul-purple/10"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Selected Custom Tags */}
          {selectedTags.filter(tag => !availableTags.includes(tag)).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selectedTags.filter(tag => !availableTags.includes(tag)).map((tag) => (
                <Badge
                  key={tag}
                  className="bg-soul-purple text-white cursor-pointer"
                  onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))}
                >
                  #{tag}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Media Options */}
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="w-full hover:bg-soul-purple/10"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isUploading}
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Add Photos"}
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={handleVoiceRecord}
            className={`flex-1 ${
              isRecording 
                ? "bg-destructive/10 border-destructive text-destructive hover:bg-destructive/20" 
                : "hover:bg-soul-purple/10"
            }`}
          >
            <Mic className="h-4 w-4 mr-2" />
            {isRecording ? "Stop" : "Voice Note"}
          </Button>
        </div>

        {/* Uploaded Images Preview */}
        {uploadedImages.length > 0 && (
          <div>
            <label className="text-sm font-medium mb-3 block">Uploaded Images</label>
            <div className="grid grid-cols-2 gap-3">
              {uploadedImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={imageUrl}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border border-border/50"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Voice Note Preview */}
        {voiceNoteUrl && (
          <div>
            <label className="text-sm font-medium mb-3 block">Voice Note</label>
            <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
              <Mic className="h-4 w-4 text-soul-purple" />
              <span className="text-sm flex-1">Voice note attached</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setVoiceNoteUrl("")}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Recent Recordings */}
        {recordings.length > 0 && !voiceNoteUrl && (
          <div>
            <label className="text-sm font-medium mb-3 block">Recent Recordings</label>
            <div className="space-y-2">
              {recordings.slice(0, 3).map((recording) => (
                <div key={recording.id} className="flex items-center gap-3 p-2 bg-accent/30 rounded-lg">
                  <Mic className="h-4 w-4 text-soul-purple" />
                  <span className="text-sm flex-1">
                    {Math.floor(recording.duration / 1000)}s recording
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveVoiceNote(recording)}
                    className="text-xs"
                  >
                    Use This
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}