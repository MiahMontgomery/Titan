import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { StatusCardData } from "@/lib/types";

interface StatusCardProps {
  data: StatusCardData;
  className?: string;
}

export function StatusCard({ data, className }: StatusCardProps) {
  const { title, value, icon, color } = data;

  // Map color string to tailwind classes
  const getBgColor = () => {
    switch (color) {
      case "green":
        return "bg-green-500 bg-opacity-20 text-green-500";
      case "blue":
        return "bg-blue-500 bg-opacity-20 text-blue-500";
      case "purple":
        return "bg-purple-500 bg-opacity-20 text-purple-500";
      case "yellow":
        return "bg-yellow-500 bg-opacity-20 text-yellow-500";
      case "red":
        return "bg-red-500 bg-opacity-20 text-red-500";
      case "teal":
        return "bg-primary bg-opacity-20 text-primary";
      default:
        return "bg-gray-500 bg-opacity-20 text-gray-500";
    }
  };

  return (
    <Card className={cn("bg-card", className)}>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", getBgColor())}>
            {icon}
          </div>
          <div className="ml-5">
            <div className="text-sm text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
