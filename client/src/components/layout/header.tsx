import { useState } from "react";
import { MenuIcon, SearchIcon, BellIcon, HelpCircleIcon, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header = ({ onToggleSidebar }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 border-b border-border flex-shrink-0 flex items-center px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
          <Database className="text-xl" />
        </div>
        <h1 className="text-xl font-semibold text-white">FINDOM</h1>
      </div>
      
      <div className="ml-auto flex items-center gap-4">
        <div className="relative w-full max-w-md hidden md:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-4 w-4 text-muted" />
          </div>
          <Input
            type="text"
            placeholder="Search projects..."
            className="w-full h-9 bg-background pl-9 pr-4 text-sm border border-border focus:ring-primary focus:border-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="w-9 h-9 rounded-md bg-background hover:bg-card border border-border text-muted hover:text-white transition"
            onClick={onToggleSidebar}
          >
            <SearchIcon className="h-4 w-4 md:hidden" />
            <BellIcon className="h-4 w-4 hidden md:block" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="w-9 h-9 rounded-md bg-background hover:bg-card border border-border text-muted hover:text-white transition"
          >
            <HelpCircleIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
