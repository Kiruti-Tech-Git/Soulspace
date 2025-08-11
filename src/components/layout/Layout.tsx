import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { signOut } = useSupabaseAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with sign out */}
      <div className="fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-b border-border z-40">
        <div className="max-w-md mx-auto px-4 py-2 flex justify-between items-center">
          <h1 className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
            Soulspace
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <main className="pb-20 pt-16">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}