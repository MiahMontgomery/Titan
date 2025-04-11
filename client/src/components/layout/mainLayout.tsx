import { useState, useEffect } from "react";
import { MenuIcon } from "lucide-react";
import Sidebar from "./sidebar";
import Header from "./header";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const isMobile = useMobile();
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const toggleSidebar = () => {
    setShowMobileSidebar(!showMobileSidebar);
  };
  
  const closeMobileSidebar = () => {
    setShowMobileSidebar(false);
  };
  
  // Close sidebar when switching from mobile to desktop
  useEffect(() => {
    if (!isMobile) {
      setShowMobileSidebar(false);
    }
  }, [isMobile]);
  
  return (
    <div className="min-h-screen flex overflow-hidden">
      {/* Regular sidebar (hidden on mobile) */}
      <Sidebar isMobile={false} />
      
      {/* Mobile sidebar (shown only when toggled) */}
      {showMobileSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
            onClick={closeMobileSidebar}
          />
          <Sidebar isMobile={true} onCloseMobile={closeMobileSidebar} />
        </>
      )}
      
      {/* Mobile sidebar toggle */}
      <div className="fixed top-4 left-4 z-30 md:hidden">
        <Button
          variant="outline" 
          size="icon"
          className="w-10 h-10 rounded-md bg-card border border-border flex items-center justify-center text-white"
          onClick={toggleSidebar}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Main content area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Main content with scrollable area */}
        <div className="flex-1 overflow-y-auto scrollbar-custom p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
