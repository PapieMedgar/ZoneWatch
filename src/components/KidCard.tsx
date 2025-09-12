import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MapPin, Shield, Clock, Phone, Navigation, ExternalLink } from "lucide-react";
import { EditKidModal } from "./EditKidModal";
import { DeleteKidDialog } from "./DeleteKidDialog";
import { Kid } from "@/types/kids";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  const handleViewMap = () => {
    // Open Google Maps with the kid's location
    const encodedLocation = encodeURIComponent(location);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`;
    window.open(mapsUrl, '_blank');
    
    toast({
      title: "Opening Map",
      description: `Viewing ${name}'s location: ${location}`,
    });
  };

  const handleCall = () => {
    // For demo purposes, we'll show a dialog with call options
    // In a real app, this would integrate with actual calling functionality
    toast({
      title: "Call Feature",
      description: `Calling functionality for ${name} would be implemented here. This could integrate with phone systems or emergency contacts.`,
    });
  };

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
          <Button 
            variant="zone" 
            size="sm" 
            className="flex-1"
            onClick={handleViewMap}
          >
            <MapPin className="h-4 w-4" />
            View Map
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Phone className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact {name}
                </DialogTitle>
                <DialogDescription>
                  Choose how you'd like to contact {name} or access emergency features.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => {
                      toast({
                        title: "Emergency Call",
                        description: `Emergency call to ${name} - This would connect to emergency services or guardian contacts.`,
                      });
                    }}
                  >
                    <Phone className="h-6 w-6 text-red-500" />
                    <span className="text-sm">Emergency</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => {
                      toast({
                        title: "Regular Call",
                        description: `Regular call to ${name} - This would connect to their device or guardian.`,
                      });
                    }}
                  >
                    <Phone className="h-6 w-6 text-green-500" />
                    <span className="text-sm">Call</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={() => {
                      toast({
                        title: "Send Message",
                        description: `Sending message to ${name} - This would open messaging app or send SMS.`,
                      });
                    }}
                  >
                    <Phone className="h-6 w-6 text-blue-500" />
                    <span className="text-sm">Message</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col gap-2"
                    onClick={handleViewMap}
                  >
                    <Navigation className="h-6 w-6 text-purple-500" />
                    <span className="text-sm">Navigate</span>
                  </Button>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-3">
                    Current Status: <Badge className={config.color}>{config.text}</Badge>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last seen: {lastSeen} at {location}
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-2 pt-2">
          <EditKidModal kid={kid} onKidUpdated={onKidUpdated} />
          <DeleteKidDialog kid={kid} onKidDeleted={onKidUpdated} />
        </div>
      </CardContent>
    </Card>
  );
}
