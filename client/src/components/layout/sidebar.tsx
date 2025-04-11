import { Link, useLocation } from "wouter";
import {
  Database,
  LayoutDashboardIcon,
  FolderIcon,
  BotIcon,
  GlobeIcon,
  KeyIcon,
  Settings2Icon,
  FileTextIcon,
  GithubIcon,
  LogOutIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isMobile: boolean;
  onCloseMobile?: () => void;
}

const Sidebar = ({ isMobile, onCloseMobile }: SidebarProps) => {
  const [location] = useLocation();
  
  const navItems = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboardIcon className="mr-2 text-lg" /> },
    { name: "Projects", path: "/projects", icon: <FolderIcon className="mr-2 text-lg" /> },
    { name: "Agents", path: "/agents", icon: <BotIcon className="mr-2 text-lg" /> },
    { name: "Web Automation", path: "/web-automation", icon: <GlobeIcon className="mr-2 text-lg" /> },
  ];
  
  const settingsItems = [
    { name: "API Keys", path: "/api-keys", icon: <KeyIcon className="mr-2 text-lg" /> },
    { name: "Settings", path: "/settings", icon: <Settings2Icon className="mr-2 text-lg" /> },
  ];
  
  const projectItems = [
    { name: "Documentation", path: "/docs", icon: <FileTextIcon className="mr-2 text-lg" /> },
    { name: "Repository", path: "/repo", icon: <GithubIcon className="mr-2 text-lg" /> },
  ];
  
  const handleNavClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };
  
  return (
    <aside className={cn(
      "w-64 flex-shrink-0 h-screen bg-card border-r border-border overflow-y-auto scrollbar-custom",
      isMobile ? "fixed top-0 left-0 z-40" : "hidden md:block"
    )}>
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center rounded-md bg-primary/10 text-primary">
          <Database className="text-xl" />
        </div>
        <h1 className="text-xl font-semibold text-white">FINDOM</h1>
      </div>
      
      <nav className="p-2">
        <div className="mb-4">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
            Main
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition",
                  location === item.path
                    ? "bg-background/60 text-white font-medium"
                    : "text-muted hover:text-white hover:bg-background/60"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
            Settings
          </div>
          <div className="space-y-1">
            {settingsItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center px-3 py-2 text-sm rounded-md transition",
                  location === item.path
                    ? "bg-background/60 text-white font-medium"
                    : "text-muted hover:text-white hover:bg-background/60"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted uppercase tracking-wider">
            Project
          </div>
          <div className="space-y-1">
            {projectItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleNavClick}
                className="flex items-center px-3 py-2 text-sm rounded-md text-muted hover:text-white hover:bg-background/60 transition"
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      <div className="p-4 mt-auto border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-medium text-white">
            US
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User Name</p>
            <p className="text-xs text-muted truncate">user@example.com</p>
          </div>
          <button className="text-muted hover:text-white">
            <LogOutIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
