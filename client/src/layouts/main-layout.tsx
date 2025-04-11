import React from "react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {children}
      </div>
    </div>
  );
}
