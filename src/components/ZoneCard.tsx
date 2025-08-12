import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Clock, Settings, Trash2 } from "lucide-react";

interface ZoneCardProps {
  name: string;
  address: string;
  radius: number;
  type: "home" | "school" | "custom";
  activeKids: number;
  totalKids: number;
  createdAt: string;
  isActive: boolean;
}

const zoneTypeConfig = {
  home: {
    color: "bg-safe-zone",
    label: "Home Zone",
  },
  school: {
    color: "bg-primary",
    label: "School Zone",
  },
  custom: {
    color: "bg-accent",
    label: "Custom Zone",
  },
};

export function ZoneCard({
  name,
  address,
  radius,
  type,
  activeKids,
  totalKids,
  createdAt,
  isActive,
}: ZoneCardProps) {
  const config = zoneTypeConfig[type];

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                className={`${config.color} text-white border-0 shadow-sm`}
                variant="secondary"
              >
                {config.label}
              </Badge>
              {!isActive && (
                <Badge variant="outline" className="text-muted-foreground">
                  Inactive
                </Badge>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            </div>
            <span className="text-muted-foreground">{radius}m radius</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">
              {activeKids} of {totalKids} kids currently in zone
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created {createdAt}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="zone" size="sm" className="flex-1">
            <MapPin className="h-4 w-4" />
            View on Map
          </Button>
          <Button variant="outline" size="sm">
            Edit Zone
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
