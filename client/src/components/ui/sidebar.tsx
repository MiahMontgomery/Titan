import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { SidebarSection } from "@/lib/types";
import { 
  Home, 
  Zap, 
  FileText, 
  Globe, 
  Settings, 
  CreditCard, 
  LogOut 
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  
  const sections: SidebarSection[] = [
    {
      title: "Main",
      items: [
        {
          title: "Dashboard",
          path: "/",
          icon: <Home className="h-5 w-5" />,
        },
        {
          title: "AI Agents",
          path: "/agents",
          icon: <Zap className="h-5 w-5" />,
        },
        {
          title: "Projects",
          path: "/projects",
          icon: <FileText className="h-5 w-5" />,
        },
        {
          title: "Web Automation",
          path: "/web-automation",
          icon: <Globe className="h-5 w-5" />,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          title: "API Keys",
          path: "/api-keys",
          icon: <Settings className="h-5 w-5" />,
        },
        {
          title: "Billing",
          path: "/billing",
          icon: <CreditCard className="h-5 w-5" />,
        },
      ],
    },
  ];

  return (
    <div className={cn("flex flex-col fixed inset-y-0 z-50 w-64 bg-card border-r border-border", className)}>
      {/* Logo section */}
      <div className="h-16 flex items-center px-4 border-b border-border">
        <h1 className="text-2xl font-bold text-primary tracking-tight">FINDOM</h1>
        <span className="ml-2 text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">BETA</span>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4">
        {sections.map((section, i) => (
          <div key={i} className="px-3 py-2">
            <h2 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {section.title}
            </h2>
            <div className="space-y-1">
              {section.items.map((item, j) => (
                <Link key={j} href={item.path}>
                  <a
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                      location === item.path
                        ? "bg-secondary text-primary"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    {React.cloneElement(item.icon, {
                      className: cn("h-5 w-5 mr-3", item.icon.props.className),
                    })}
                    {item.title}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      {/* User section */}
      <div className="flex items-center p-4 border-t border-border">
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-foreground">Admin User</p>
          <p className="text-xs text-muted-foreground">admin@example.com</p>
        </div>
        <button className="ml-auto text-muted-foreground hover:text-primary">
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
