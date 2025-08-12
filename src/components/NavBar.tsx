import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, User, Shield, Plus } from "lucide-react";

export function Navbar() {
  return (
    <nav className="bg-card border-b border-border shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-glow shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                ZoneWatch Kids
              </h1>
              <p className="text-xs text-muted-foreground">
                Family Safety Monitor
              </p>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center gap-3">
            <Button variant="safety" size="sm">
              <Plus className="h-4 w-4" />
              Add Zone
            </Button>

            <div className="relative">
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>
              <Badge
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-danger-zone text-white text-xs border-0"
                variant="secondary"
              >
                2
              </Badge>
            </div>

            <Button variant="ghost" size="sm">
              <Settings className="h-5 w-5" />
            </Button>

            <Button variant="ghost" size="sm">
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
