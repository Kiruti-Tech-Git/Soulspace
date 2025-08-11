import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sparkles, Volume2, Heart, Plus, Search, Shuffle, BookOpen, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const affirmationCategories = [
  { name: "All", color: "bg-soul-purple" },
  { name: "Confidence", color: "bg-soul-orange" },
  { name: "Love", color: "bg-soul-pink" },
  { name: "Success", color: "bg-soul-green" },
  { name: "Peace", color: "bg-soul-blue" },
  { name: "Health", color: "bg-soul-neutral" }
];

const defaultAffirmations = [
  {
    id: 1,
    text: "I am worthy of love, happiness, and abundance in all areas of my life",
    category: "Confidence",
    isFavorite: true,
    isDaily: true
  },
  {
    id: 2,
    text: "My heart is open to giving and receiving love unconditionally",
    category: "Love",
    isFavorite: false,
    isDaily: false
  },
  {
    id: 3,
    text: "I attract success and opportunities that align with my highest good",
    category: "Success",
    isFavorite: true,
    isDaily: false
  },
  {
    id: 4,
    text: "Peace flows through me with every breath I take",
    category: "Peace",
    isFavorite: false,
    isDaily: false
  },
  {
    id: 5,
    text: "My body is healthy, strong, and filled with vibrant energy",
    category: "Health",
    isFavorite: false,
    isDaily: false
  },
  {
    id: 6,
    text: "I believe in myself and my ability to create positive change",
    category: "Confidence",
    isFavorite: false,
    isDaily: false
  },
  {
    id: 7,
    text: "I choose to see the beauty and magic in everyday moments",
    category: "Peace",
    isFavorite: true,
    isDaily: true
  }
];

export default function Affirmations() {
  const [affirmations, setAffirmations] = useState(defaultAffirmations);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [dailyAffirmation, setDailyAffirmation] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newAffirmation, setNewAffirmation] = useState("");
  const [newCategory, setNewCategory] = useState("Confidence");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set today's affirmation
    const dailyOnes = affirmations.filter(a => a.isDaily);
    const randomDaily = dailyOnes[Math.floor(Math.random() * dailyOnes.length)];
    setDailyAffirmation(randomDaily?.text || affirmations[0].text);
  }, [affirmations]);

  const filteredAffirmations = affirmations.filter(affirmation => {
    const matchesCategory = selectedCategory === "All" || affirmation.category === selectedCategory;
    const matchesSearch = affirmation.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCreateAffirmation = () => {
    if (!newAffirmation.trim()) return;

    const newAff = {
      id: Date.now(),
      text: newAffirmation.trim(),
      category: newCategory,
      isFavorite: false,
      isDaily: false
    };

    setAffirmations(prev => [...prev, newAff]);
    setNewAffirmation("");
    setIsCreating(false);
    
    toast({
      title: "Affirmation created! ✨",
      description: "Your personal affirmation has been added."
    });
  };

  const toggleFavorite = (id: number) => {
    setAffirmations(prev => prev.map(aff => 
      aff.id === id ? { ...aff, isFavorite: !aff.isFavorite } : aff
    ));
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Speech not supported",
        description: "Text-to-speech is not available in your browser.",
        variant: "destructive"
      });
    }
  };

  const getRandomAffirmation = () => {
    const randomAff = affirmations[Math.floor(Math.random() * affirmations.length)];
    setDailyAffirmation(randomAff.text);
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold mb-2">Affirmations</h1>
        <p className="text-muted-foreground">Positive words for your soul</p>
      </div>

      {/* Daily Affirmation */}
      <Card className="bg-gradient-primary text-white border-0 shadow-glow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="text-lg">Today's Affirmation</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSpeak(dailyAffirmation)}
                className="text-white hover:bg-white/20 p-2"
                disabled={isSpeaking}
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={getRandomAffirmation}
                className="text-white hover:bg-white/20 p-2"
              >
                <Shuffle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-white/95 font-medium italic text-lg leading-relaxed">
            "{dailyAffirmation}"
          </p>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search affirmations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rounded-xl border-border/50 focus:border-soul-purple"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {affirmationCategories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.name)}
              className={`shrink-0 rounded-full ${
                selectedCategory === category.name 
                  ? "bg-soul-purple hover:bg-soul-purple/90 text-white" 
                  : "hover:bg-soul-purple/10"
              }`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Create New Affirmation */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogTrigger asChild>
          <Button className="w-full bg-soul-purple hover:bg-soul-purple/90 text-white shadow-soft">
            <Plus className="h-4 w-4 mr-2" />
            Create Personal Affirmation
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Affirmation</DialogTitle>
            <DialogDescription>
              Write a personal affirmation that resonates with your soul
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              placeholder="I am..."
              value={newAffirmation}
              onChange={(e) => setNewAffirmation(e.target.value)}
              className="min-h-24 rounded-xl border-border/50 focus:border-soul-purple resize-none"
            />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-2">
                {affirmationCategories.slice(1).map((category) => (
                  <Button
                    key={category.name}
                    variant={newCategory === category.name ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNewCategory(category.name)}
                    className={`${
                      newCategory === category.name 
                        ? "bg-soul-purple hover:bg-soul-purple/90 text-white" 
                        : "hover:bg-soul-purple/10"
                    }`}
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCreateAffirmation}
                className="flex-1 bg-soul-purple hover:bg-soul-purple/90 text-white"
                disabled={!newAffirmation.trim()}
              >
                Create
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreating(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Affirmations List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">All Affirmations</h2>
          <Badge variant="secondary" className="bg-soul-purple-light text-soul-purple">
            {filteredAffirmations.length} items
          </Badge>
        </div>

        {filteredAffirmations.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-soul-purple-light rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-soul-purple" />
                </div>
                <h3 className="font-medium">No affirmations found</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm || selectedCategory !== "All"
                    ? "Try adjusting your filters"
                    : "Create your first personal affirmation"}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredAffirmations.map((affirmation) => (
            <Card key={affirmation.id} className="hover:shadow-soft transition-all duration-200 border border-border/50 hover:border-soul-purple/30">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-soul-purple-light text-soul-purple text-xs"
                  >
                    {affirmation.category}
                  </Badge>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSpeak(affirmation.text)}
                      className="p-2 hover:bg-soul-purple/10"
                      disabled={isSpeaking}
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(affirmation.id)}
                      className="p-2 hover:bg-soul-purple/10"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          affirmation.isFavorite 
                            ? "fill-red-500 text-red-500" 
                            : "text-muted-foreground"
                        }`} 
                      />
                    </Button>
                  </div>
                </div>
                
                <p className="text-foreground leading-relaxed italic">
                  "{affirmation.text}"
                </p>
                
                {affirmation.isDaily && (
                  <div className="flex items-center gap-1 mt-3">
                    <Star className="h-3 w-3 text-soul-orange fill-current" />
                    <span className="text-xs text-soul-orange font-medium">Daily Affirmation</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}