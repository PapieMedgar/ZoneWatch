import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Shield, Clock, Phone } from "lucide-react";
import { EditKidModal } from "./EditKidModal";
import { DeleteKidDialog } from "./DeleteKidDialog";
import { Kid } from "@/types/kids";

interface KidCardProps {
  kid: Kid;
  onKidUpdated: () => void;
}

const statusConfig = {
  safe: {
    color: "bg-safe-zone",
    text: "Safe in Zone",
    icon: Shield,
  },
  warning: {
    color: "bg-warning-zone",
    text: "Near Boundary",
    icon: MapPin,
  },
  alert: {
    color: "bg-danger-zone",
    text: "Outside Zone",
    icon: MapPin,
  },
};

export function KidCard({ kid, onKidUpdated }: KidCardProps) {
  const { name, age, status, location, lastSeen, avatar, zonesCount } = kid;
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-primary/20">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-white font-semibold">
                {name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{name}</CardTitle>
              <p className="text-sm text-muted-foreground">Age {age}</p>
            </div>
          </div>
          <Badge
            className={`${config.color} text-white border-0 shadow-sm`}
            variant="secondary"
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-foreground">{location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last seen {lastSeen}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {zonesCount} active zones
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="zone" size="sm" className="flex-1">
            <MapPin className="h-4 w-4" />
            View Map
          </Button>
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2 pt-2">
          <EditKidModal kid={kid} onKidUpdated={onKidUpdated} />
          <DeleteKidDialog kid={kid} onKidDeleted={onKidUpdated} />
        </div>
      </CardContent>
    </Card>
  );
}
