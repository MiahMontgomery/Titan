export interface LogoProps {
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ showText = true, size = 'md' }: LogoProps) {
  const sizeClass = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  const textSizeClass = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className="flex items-center">
      <div className={`${sizeClass[size]} bg-gradient-to-br from-accent to-blue-600 rounded-md flex items-center justify-center`}>
        <span className="text-black font-bold text-sm">T</span>
      </div>
      
      {showText && (
        <span className={`ml-2 font-bold bg-gradient-to-r from-accent to-blue-500 bg-clip-text text-transparent ${textSizeClass[size]}`}>
          TITAN
        </span>
      )}
    </div>
  );
}