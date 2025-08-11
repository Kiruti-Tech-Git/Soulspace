import { NavLink } from "react-router-dom";
import { Home, FileText, Image, TrendingUp, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: FileText, label: "Journal", path: "/journal" },
  { icon: Image, label: "Vision", path: "/vision" },
  { icon: TrendingUp, label: "Mood", path: "/mood" },
  { icon: User, label: "Profile", path: "/profile" }
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px]",
                isActive
                  ? "text-primary bg-primary/10 shadow-soft"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )
            }
          >
            <Icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}