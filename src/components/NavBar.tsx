import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, User, Shield, Plus, Menu, X } from "lucide-react";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center gap-3">
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

          {/* Mobile Hamburger */}
          <div className="sm:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="sm:hidden flex flex-col gap-2 pb-4 border-t border-border mt-2">
            <Button variant="safety" size="sm" className="w-full">
              <Plus className="h-4 w-4" />
              Add Zone
            </Button>
            <Button variant="ghost" size="sm" className="w-full">
              <Bell className="h-5 w-5" />
              Notifications{" "}
              <Badge className="ml-2 bg-danger-zone text-white border-0">
                2
              </Badge>
            </Button>
            <Button variant="ghost" size="sm" className="w-full">
              <Settings className="h-5 w-5" />
              Settings
            </Button>
            <Button variant="ghost" size="sm" className="w-full">
              <User className="h-5 w-5" />
              Profile
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
