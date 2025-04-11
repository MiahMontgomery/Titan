import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  fallback: React.ReactNode;
  className?: string;
}

export function SafeImage({ src, alt, fallback, className = '' }: SafeImageProps) {
  const [error, setError] = useState(false);
  
  // Don't try to render OpenAI "share" URLs as images
  const isInvalidImageUrl = !src || src.includes('chat.openai.com') || src.includes('share/file');
  
  if (isInvalidImageUrl || error) {
    return <>{fallback}</>;
  }
  
  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
    />
  );
}