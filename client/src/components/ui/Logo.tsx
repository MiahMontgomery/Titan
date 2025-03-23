export function Logo() {
  return (
    <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center overflow-hidden">
      <svg className="w-6 h-6 text-accent" viewBox="0 0 300 300" fill="none" strokeWidth="0">
        {/* Ninja star (manually traced from reference image) */}
        <path 
          d="M150,20 
          C145,30 138,87 132,118
          C115,113 70,105 40,100
          C35,115 55,135 75,145
          C62,155 42,190 30,220
          C55,205 105,175 118,165
          C130,180 145,205 150,225
          C155,205 170,180 182,165
          C195,175 245,205 270,220
          C258,190 238,155 225,145
          C245,135 265,115 260,100
          C230,105 185,113 168,118
          C162,87 155,30 150,20Z" 
          fill="currentColor" 
        />
        <circle cx="150" cy="150" r="15" fill="white" />
      </svg>
    </div>
  );
}
