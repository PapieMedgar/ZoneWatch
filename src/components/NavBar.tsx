import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, User, Shield, Plus, Menu, X } from "lucide-react";
import { AddZoneModal } from "@/components/AddZoneModal";
import { useEffect, useMemo, useState } from "react";
import { subscribeActivity } from "@/lib/firestore";
import { Activity } from "@/types/activity";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { loadSettings, onSettingsUpdated, saveSettings } from "@/lib/settings";

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(loadSettings());

  useEffect(() => {
    const unsub = subscribeActivity((items) => setActivity(items));
    const off = onSettingsUpdated((s) => setSettings(s));
    return () => {
      unsub?.();
      off?.();
    };
  }, []);

  const unreadCount = useMemo(() => Math.min(activity.length, 9), [activity]);

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
            <AddZoneModal onZoneAdded={() => { /* Index page reloads zones via subscription */ }} />

            <div className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Bell className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {activity.slice(0, 8).map((a) => (
                    <DropdownMenuItem key={a.id} className="flex-col items-start whitespace-normal">
                      <span className="text-sm font-medium">{a.message}</span>
                      <span className="text-xs text-muted-foreground">{a.type} • {a.severity}</span>
                    </DropdownMenuItem>
                  ))}
                  {activity.length === 0 && (
                    <DropdownMenuItem disabled>No recent activity</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-danger-zone text-white text-xs border-0"
                  variant="secondary"
                >
                  {unreadCount}
                </Badge>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                  <span className="text-sm">Geofencing</span>
                  <input
                    type="checkbox"
                    checked={settings.geofencingEnabled}
                    onChange={(ev) => saveSettings({ geofencingEnabled: ev.target.checked })}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                  <span className="text-sm">Near radius ×</span>
                  <input
                    className="w-20 border rounded px-1 py-0.5 text-right"
                    type="number"
                    step="0.01"
                    min="1"
                    value={settings.nearRadiusMultiplier}
                    onChange={(ev) => saveSettings({ nearRadiusMultiplier: parseFloat(ev.target.value) || 1.15 })}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
            <AddZoneModal onZoneAdded={() => {}} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  <Bell className="h-5 w-5" />
                  Notifications
                  {unreadCount > 0 && (
                    <Badge className="ml-2 bg-danger-zone text-white border-0">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {activity.slice(0, 8).map((a) => (
                  <DropdownMenuItem key={a.id} className="flex-col items-start whitespace-normal">
                    <span className="text-sm font-medium">{a.message}</span>
                    <span className="text-xs text-muted-foreground">{a.type} • {a.severity}</span>
                  </DropdownMenuItem>
                ))}
                {activity.length === 0 && (
                  <DropdownMenuItem disabled>No recent activity</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                  <span className="text-sm">Geofencing</span>
                  <input
                    type="checkbox"
                    checked={settings.geofencingEnabled}
                    onChange={(ev) => saveSettings({ geofencingEnabled: ev.target.checked })}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                  <span className="text-sm">Near radius ×</span>
                  <input
                    className="w-20 border rounded px-1 py-0.5 text-right"
                    type="number"
                    step="0.01"
                    min="1"
                    value={settings.nearRadiusMultiplier}
                    onChange={(ev) => saveSettings({ nearRadiusMultiplier: parseFloat(ev.target.value) || 1.15 })}
                  />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
