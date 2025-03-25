export function Logo() {
  return (
    <div className="flex items-center w-10 h-10 relative">
      <div className="absolute w-7 h-7 bg-accent rounded-lg transform rotate-45"></div>
      <div className="absolute w-7 h-7 bg-background rounded-md border-2 border-accent"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full"></div>
    </div>
  );
}