import { Link, useLocation } from 'wouter';
import { Logo } from '@/components/ui/Logo';
import { Settings, Home, ChevronRight, User, LogOut } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { StatusIndicator } from './StatusIndicator';

export function Navigation() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  const navItems = [
    { label: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { label: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];
  
  return (
    <>
      {/* Desktop navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen">
        <div className="p-6">
          <Logo />
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} href={item.path}>
              <a
                className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  isActive(item.path)
                    ? 'bg-accent text-gray-900 font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </a>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300">
                <User size={18} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-300">Admin User</p>
                <p className="text-xs text-gray-500">admin@example.com</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <StatusIndicator isWorking={true} showLabel={true} />
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>
      
      {/* Mobile navigation */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <Logo />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="text-gray-400"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {showMobileMenu ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </Button>
      </header>
      
      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="md:hidden absolute top-14 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
          <nav className="py-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center px-4 py-3 text-sm ${
                    isActive(item.path)
                      ? 'bg-accent text-gray-900 font-medium'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                  <ChevronRight className="ml-auto" size={16} />
                </a>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800 flex items-center justify-between">
            <StatusIndicator isWorking={true} showLabel={true} />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-gray-300 mr-2">
                <User size={18} />
              </div>
              <p className="text-sm font-medium text-gray-300">Admin</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}