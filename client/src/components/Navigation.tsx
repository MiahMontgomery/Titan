import { Link, useLocation } from 'wouter';
import { Logo } from '@/components/ui/Logo';
import { Home, User } from 'lucide-react';
import { StatusIndicator } from './StatusIndicator';

export function Navigation() {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/' && location === '/') return true;
    if (path !== '/' && location.startsWith(path)) return true;
    return false;
  };
  
  const navItems = [
    { label: 'Home', path: '/', icon: <Home size={20} /> },
    { label: 'Dashboard', path: '/dashboard', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
  ];
  
  return (
    <aside className="flex flex-col w-64 bg-gray-900 border-r border-gray-800 h-screen">
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
        <div className="flex items-center justify-between">
          <StatusIndicator isWorking={true} showLabel={true} />
        </div>
      </div>
    </aside>
  );
}