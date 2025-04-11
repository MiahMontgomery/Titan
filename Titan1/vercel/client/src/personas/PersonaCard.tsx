import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  User, MessageSquare, FileText, Sparkles, BarChart, 
  Edit2, Trash2, Power
} from "lucide-react";
import { useState } from "react";
import { Persona } from "@/lib/types";
import { calculatePersonaScore } from "@/lib/utils";

interface PersonaCardProps {
  persona: Persona;
  onEdit: (persona: Persona) => void;
  onDelete: (personaId: string) => void;
  onToggleActive: (personaId: string, isActive: boolean) => void;
  onViewStats: (personaId: string) => void;
  onViewMessages: (personaId: string) => void;
  onViewContent: (personaId: string) => void;
}

export default function PersonaCard({
  persona,
  onEdit,
  onDelete,
  onToggleActive,
  onViewStats,
  onViewMessages,
  onViewContent
}: PersonaCardProps) {
  const [isActive, setIsActive] = useState(persona.isActive);
  const performanceScore = calculatePersonaScore(persona);
  
  const handleToggleActive = () => {
    const newState = !isActive;
    setIsActive(newState);
    onToggleActive(persona.id, newState);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(part => part[0]).join('').toUpperCase();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-300">
      <CardHeader className="relative pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary/10">
              <AvatarImage src={persona.imageUrl} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(persona.displayName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-xl">{persona.displayName}</CardTitle>
              <CardDescription className="text-sm mt-1">
                @{persona.name}
              </CardDescription>
            </div>
          </div>
          <Switch 
            checked={isActive} 
            onCheckedChange={handleToggleActive}
            aria-label="Toggle active state"
          />
        </div>
        <div className="mt-3">
          <Badge variant={isActive ? "default" : "outline"} className="mr-2">
            {isActive ? "Active" : "Inactive"}
          </Badge>
          <Badge variant="secondary" className="bg-primary/10">
            <BarChart className="h-3 w-3 mr-1" /> 
            Score: {performanceScore}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {persona.description}
        </p>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Income</span>
            </div>
            <span className="font-semibold">
              {formatCurrency(persona.stats.totalIncome)}
            </span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Messages</span>
            </div>
            <span className="font-semibold">{persona.stats.messageCount}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span>Content</span>
            </div>
            <span className="font-semibold">{persona.stats.contentPublished} published</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span>Performance</span>
            <span>{performanceScore}%</span>
          </div>
          <Progress value={performanceScore} className="h-2" />
        </div>
      </CardContent>
      
      <CardFooter className="bg-muted/40 pt-3 pb-3 flex justify-between">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onEdit(persona)}
            className="h-8"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(persona.id)}
            className="h-8"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onViewStats(persona.id)}
          >
            <BarChart className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onViewMessages(persona.id)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => onViewContent(persona.id)}
          >
            <FileText className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}