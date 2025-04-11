import { Persona } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { calculatePersonaScore } from "../lib/utils";

interface PersonaCardProps {
  persona: Persona;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: (isActive: boolean) => void;
  isToggling: boolean;
  isDeleting: boolean;
}

export function PersonaCard({
  persona,
  onEdit,
  onDelete,
  onToggleActive,
  isToggling,
  isDeleting
}: PersonaCardProps) {
  const performanceScore = calculatePersonaScore(persona);
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  return (
    <Card className="overflow-hidden border-gray-700 bg-card hover:bg-card/90 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={persona.imageUrl || ""} alt={persona.name} />
              <AvatarFallback>{getInitials(persona.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{persona.displayName}</CardTitle>
              <CardDescription className="text-sm text-gray-400">
                {persona.name}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Active</span>
            <Switch 
              checked={persona.isActive} 
              onCheckedChange={onToggleActive} 
              disabled={isToggling}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="mb-3">
          <p className="text-gray-300 line-clamp-2">{persona.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-background rounded-md p-2">
            <span className="block text-gray-400">Tone</span>
            <span className="font-medium">{persona.behavior.tone}</span>
          </div>
          <div className="bg-background rounded-md p-2">
            <span className="block text-gray-400">Style</span>
            <span className="font-medium">{persona.behavior.style}</span>
          </div>
          <div className="bg-background rounded-md p-2">
            <span className="block text-gray-400">Responsiveness</span>
            <span className="font-medium">{persona.behavior.responsiveness}%</span>
          </div>
          <div className="bg-background rounded-md p-2">
            <span className="block text-gray-400">Performance</span>
            <span className="font-medium">{performanceScore}%</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t border-gray-700 bg-muted/30 px-6 py-3">
        <div className="flex justify-between w-full">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onEdit}
          >
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={onDelete}
            disabled={isDeleting}
          >
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}