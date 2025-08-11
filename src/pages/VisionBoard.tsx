import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Heart, Star, Edit3, MoreHorizontal, Image as ImageIcon, Quote, Palette, Upload, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { visionBoardService, storageService } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const colorOptions = [
  "bg-soul-purple", "bg-soul-pink", "bg-soul-blue", 
  "bg-soul-green", "bg-soul-orange", "bg-soul-neutral"
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;
export default function VisionBoard() {
  const [boards, setBoards] = useState<any[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newItemType, setNewItemType] = useState<"image" | "quote" | "color">("image");
  const [newItemContent, setNewItemContent] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [pendingImages, setPendingImages] = useState<{file: File, preview: string}[]>([]);
  const [imageCaption, setImageCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadBoards();
    }
  }, [user]);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await visionBoardService.getBoards();
      setBoards(data);
      if (data.length > 0 && !selectedBoard) {
        setSelectedBoard(data[0]);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load vision boards",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;

    try {
      const newBoard = await visionBoardService.createBoard({
        title: newBoardTitle.trim(),
        description: newBoardDescription.trim() || null,
        is_favorite: false,
      });

      setBoards(prev => [newBoard, ...prev]);
      setSelectedBoard(newBoard);
      setNewBoardTitle("");
      setNewBoardDescription("");
      setIsCreatingBoard(false);
      
      toast({
        title: "Vision board created! ✨",
        description: "Start adding your dreams and aspirations."
      });
    } catch (error: any) {
      toast({
        title: "Failed to create board",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate files and create previews
    const validFiles: {file: File, preview: string}[] = [];
    
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} is too large. Maximum size is 5MB.`,
          variant: "destructive"
        });
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image.`,
          variant: "destructive"
        });
        continue;
      }
      
      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview });
    }
    
    if (validFiles.length > 0) {
      setPendingImages(validFiles);
      setIsCreating(true);
      setNewItemType("image");
    }
    
    // Reset the input
    event.target.value = '';
  };

  const handleAddItem = async () => {
    if (newItemType === "image" && pendingImages.length > 0) {
      // Handle pending image uploads
      try {
        setIsUploading(true);
        const uploadPromises = pendingImages.map(async ({ file }) => {
          const imageUrl = await storageService.uploadImage(file, 'visionboardimages');
          
          return await visionBoardService.addItem({
            board_id: selectedBoard.id,
            item_type: 'image',
            content: imageUrl,
            item_title: imageCaption.trim() || file.name.split('.')[0],
          });
        });

        const newItems = await Promise.all(uploadPromises);
        
        // Update the selected board with new items
        setSelectedBoard(prev => ({
          ...prev,
          vision_board_items: [...(prev.vision_board_items || []), ...newItems]
        }));
        
        // Update boards list
        setBoards(prev => prev.map(board => 
          board.id === selectedBoard.id 
            ? { ...board, vision_board_items: [...(board.vision_board_items || []), ...newItems] }
            : board
        ));
        
        // Clean up
        pendingImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
        setPendingImages([]);
        setImageCaption("");
        setIsCreating(false);
        
        toast({
          title: "Images added! ✨",
          description: `${newItems.length} image(s) added to your vision board.`
        });
        return;
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      } finally {
        setIsUploading(false);
      }
    }
    
    // Handle other item types
    if (!newItemContent.trim()) return;

    try {
      const newItem = await visionBoardService.addItem({
        board_id: selectedBoard.id,
        item_type: newItemType,
        content: newItemContent.trim(),
        item_title: newItemTitle.trim() || null,
      });

      // Update the selected board with new item
      setSelectedBoard(prev => ({
        ...prev,
        vision_board_items: [...(prev.vision_board_items || []), newItem]
      }));
      
      // Update boards list
      setBoards(prev => prev.map(board => 
        board.id === selectedBoard.id 
          ? { ...board, vision_board_items: [...(board.vision_board_items || []), newItem] }
          : board
      ));

      setNewItemContent("");
      setNewItemTitle("");
      setIsCreating(false);
      
      toast({
        title: "Item added! ✨",
        description: "Your vision is taking shape."
      });
    } catch (error: any) {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await visionBoardService.deleteItem(itemId);
      
      // Update the selected board
      setSelectedBoard(prev => ({
        ...prev,
        vision_board_items: prev.vision_board_items?.filter(item => item.id !== itemId) || []
      }));
      
      // Update boards list
      setBoards(prev => prev.map(board => 
        board.id === selectedBoard.id 
          ? { ...board, vision_board_items: board.vision_board_items?.filter(item => item.id !== itemId) || [] }
          : board
      ));
      
      toast({
        title: "Item removed",
        description: "Item has been deleted from your vision board."
      });
    } catch (error: any) {
      toast({
        title: "Failed to delete item",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const toggleFavorite = async (boardId: string) => {
    try {
      const board = boards.find(b => b.id === boardId);
      if (!board) return;

      const updatedBoard = await visionBoardService.updateBoard(boardId, {
        is_favorite: !board.is_favorite
      });

      setBoards(prev => prev.map(board => 
        board.id === boardId 
          ? { ...board, is_favorite: updatedBoard.is_favorite }
          : { ...board, is_favorite: false }
      ));
      
      if (selectedBoard?.id === boardId) {
        setSelectedBoard(prev => ({ ...prev, is_favorite: updatedBoard.is_favorite }));
      }
    } catch (error: any) {
      toast({
        title: "Failed to update favorite",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center">
        <p>Please sign in to access your vision boards.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 pt-8 text-center">
        <p>Loading your vision boards...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-2xl font-semibold mb-2">Vision Board</h1>
        <p className="text-muted-foreground">Visualize your dreams</p>
      </div>

      {/* Board Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">My Boards</h2>
          <Dialog open={isCreatingBoard} onOpenChange={setIsCreatingBoard}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="hover:bg-soul-purple/10">
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Create Vision Board</DialogTitle>
                <DialogDescription>
                  Create a new space for your dreams and aspirations
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <Input
                  placeholder="Board title..."
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                />
                
                <Textarea
                  placeholder="Description (optional)..."
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  className="min-h-20"
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateBoard}
                    className="flex-1 bg-soul-purple hover:bg-soul-purple/90 text-white"
                    disabled={!newBoardTitle.trim()}
                  >
                    Create Board
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreatingBoard(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {boards.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="space-y-3">
                <div className="p-4 bg-soul-purple-light rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-soul-purple" />
                </div>
                <h3 className="font-medium">No vision boards yet</h3>
                <p className="text-muted-foreground text-sm">
                  Create your first vision board to start manifesting your dreams
                </p>
                <Button 
                  onClick={() => setIsCreatingBoard(true)}
                  className="mt-4 bg-soul-purple hover:bg-soul-purple/90 text-white"
                >
                  Create First Board
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {boards.map((board) => (
                <Button
                  key={board.id}
                  variant={selectedBoard?.id === board.id ? "default" : "outline"}
                  onClick={() => setSelectedBoard(board)}
                  className={`shrink-0 relative ${
                    selectedBoard?.id === board.id 
                      ? "bg-soul-purple hover:bg-soul-purple/90 text-white" 
                      : "hover:bg-soul-purple/10"
                  }`}
                >
                  {board.title}
                  {board.is_favorite && (
                    <Star className="h-3 w-3 ml-2 fill-current" />
                  )}
                </Button>
              ))}
            </div>

            {/* Current Board */}
            {selectedBoard && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{selectedBoard.title}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(selectedBoard.id)}
                          className="p-1"
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              selectedBoard.is_favorite 
                                ? "fill-red-500 text-red-500" 
                                : "text-muted-foreground"
                            }`} 
                          />
                        </Button>
                      </div>
                      {selectedBoard.description && (
                        <CardDescription>{selectedBoard.description}</CardDescription>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" className="p-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Vision Board Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {selectedBoard.vision_board_items?.map((item) => (
                      <Card key={item.id} className="group hover:shadow-soft transition-all duration-200 cursor-pointer border border-border/50 hover:border-soul-purple/30 relative">
                        <CardContent className="p-4 text-center space-y-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          
                          <div className="text-4xl">
                            {item.item_type === "image" && (
                              item.content.startsWith('data:image') || item.content.startsWith('http') ? (
                                <img 
                                  src={item.content} 
                                  alt={item.item_title || "Vision item"} 
                                  className="w-full h-20 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-xs text-gray-500">Image</span>
                                </div>
                              )
                            )}
                            {item.item_type === "quote" && <Quote className="h-8 w-8 mx-auto text-soul-purple" />}
                            {item.item_type === "color" && <div className={`w-12 h-12 rounded-xl mx-auto ${item.content}`} />}
                          </div>
                          {item.item_title && (
                            <h4 className="font-medium text-sm">{item.item_title}</h4>
                          )}
                          {item.item_type === "quote" && (
                            <p className="text-xs text-muted-foreground italic">"{item.content}"</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Add New Item */}
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                      <DialogTrigger asChild>
                        <Card className="hover:shadow-soft transition-all duration-200 cursor-pointer border-2 border-dashed border-soul-purple/30 hover:border-soul-purple">
                          <CardContent className="p-4 flex flex-col items-center justify-center h-24 text-soul-purple">
                            <Plus className="h-6 w-6 mb-2" />
                            <span className="text-sm font-medium">Add Item</span>
                          </CardContent>
                        </Card>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader>
                          <DialogTitle>Add Vision Item</DialogTitle>
                          <DialogDescription>
                            Add an image, quote, or color to your vision board
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          {/* Item Type Selector */}
                          <div className="flex gap-2">
                            {pendingImages.length === 0 && (
                              <Button
                                variant={newItemType === "image" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setNewItemType("image")}
                                className={newItemType === "image" ? "bg-soul-purple hover:bg-soul-purple/90" : ""}
                              >
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Image
                              </Button>
                            )}
                            <Button
                              variant={newItemType === "quote" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNewItemType("quote")}
                              className={newItemType === "quote" ? "bg-soul-purple hover:bg-soul-purple/90" : ""}
                            >
                              <Quote className="h-4 w-4 mr-2" />
                              Quote
                            </Button>
                            <Button
                              variant={newItemType === "color" ? "default" : "outline"}
                              size="sm"
                              onClick={() => setNewItemType("color")}
                              className={newItemType === "color" ? "bg-soul-purple hover:bg-soul-purple/90" : ""}
                            >
                              <Palette className="h-4 w-4 mr-2" />
                              Color
                            </Button>
                          </div>

                          {/* Content Input */}
                          {pendingImages.length > 0 && (
                            <>
                              <div>
                                <h4 className="font-medium mb-2">Selected Images</h4>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                  {pendingImages.map(({ preview }, index) => (
                                    <img
                                      key={index}
                                      src={preview}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg border"
                                    />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="image-caption" className="text-sm font-medium">Caption/Title</Label>
                                <Input
                                  id="image-caption"
                                  placeholder="Add a caption for your image(s)..."
                                  value={imageCaption}
                                  onChange={(e) => setImageCaption(e.target.value)}
                                  className="mt-1"
                                />
                              </div>
                            </>
                          )}
                          
                          {pendingImages.length === 0 && (
                            <>
                          {newItemType === "image" && (
                            <>
                              <Input
                                placeholder="Add emoji or image URL..."
                                value={newItemContent}
                                onChange={(e) => setNewItemContent(e.target.value)}
                              />
                              <Input
                                placeholder="Title (optional)"
                                value={newItemTitle}
                                onChange={(e) => setNewItemTitle(e.target.value)}
                              />
                              <div className="text-center">
                                <span className="text-sm text-muted-foreground">or</span>
                              </div>
                              <div>
                                <input
                                  type="file"
                                  id="vision-image-upload"
                                  multiple
                                  accept="image/*"
                                  onChange={handleImageUpload}
                                  className="hidden"
                                />
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => document.getElementById('vision-image-upload')?.click()}
                                  disabled={isUploading}
                                >
                                  <Upload className="h-4 w-4 mr-2" />
                                  {isUploading ? "Uploading..." : "Upload Images"}
                                </Button>
                              </div>
                            </>
                          )}

                          {newItemType === "quote" && (
                            <Textarea
                              placeholder="Enter your inspirational quote..."
                              value={newItemContent}
                              onChange={(e) => setNewItemContent(e.target.value)}
                              className="min-h-20"
                            />
                          )}

                          {newItemType === "color" && (
                            <div className="grid grid-cols-3 gap-2">
                              {colorOptions.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewItemContent(color)}
                                  className={`w-12 h-12 rounded-lg ${color} ${
                                    newItemContent === color ? "ring-2 ring-soul-purple ring-offset-2" : ""
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                            </>
                          )}

                          <div className="flex gap-2">
                            <Button 
                              onClick={handleAddItem}
                              className="flex-1 bg-soul-purple hover:bg-soul-purple/90 text-white"
                              disabled={pendingImages.length > 0 ? isUploading : !newItemContent.trim()}
                            >
                              {isUploading ? "Adding..." : "Add Item"}
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => {
                                // Clean up pending images
                                pendingImages.forEach(({ preview }) => URL.revokeObjectURL(preview));
                                setPendingImages([]);
                                setImageCaption("");
                                setIsCreating(false);
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}