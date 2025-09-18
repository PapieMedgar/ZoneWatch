import { useState, useEffect } from "react";
import { Navbar } from "@/components/NavBar";
import { QuickStats } from "@/components/QuickStats";
import { KidCard } from "@/components/KidCard";
import { ZoneCard } from "@/components/ZoneCard";
import { AddKidModal } from "@/components/AddKidModal";
import { AddZoneModal } from "@/components/AddZoneModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Users, Shield, AlertTriangle } from "lucide-react";
import { getKids, getZones, getRecentActivity, subscribeKids, subscribeZones, subscribeActivity, updateKid, updateZone, addActivity } from "@/lib/firestore";
import { Kid } from "@/types/kids";
import { Zone } from "@/types/zone";
import { Activity } from "@/types/activity";
import { Toaster } from "@/components/ui/toaster";
import { computeGeofenceStatus, statusFromGeofence } from "@/lib/utils";
import { loadSettings, onSettingsUpdated } from "@/lib/settings";



// Zones will be loaded from Firestore

const Index = () => {
  const [kids, setKids] = useState<Kid[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [settings, setSettings] = useState(loadSettings());

  const loadKids = async () => {
    try {
      setLoading(true);
      console.log("Loading kids...");
      const kidsData = await getKids();
      console.log("Kids data received:", kidsData);
      setKids(kidsData);
    } catch (error) {
      console.error("Error loading kids:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadZones = async () => {
    try {
      setZonesLoading(true);
      const zonesData = await getZones();
      setZones(zonesData);
    } catch (error) {
      console.error("Error loading zones:", error);
    } finally {
      setZonesLoading(false);
    }
  };

  const loadActivity = async () => {
    try {
      setActivityLoading(true);
      const items = await getRecentActivity(10);
      setActivity(items);
    } catch (error) {
      console.error("Error loading activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  useEffect(() => {
    loadKids();
    loadZones();
    loadActivity();

    // Real-time subscriptions
    const unsubKids = subscribeKids((kidsLive) => {
      setKids(kidsLive);
    });
    const unsubZones = subscribeZones((zonesLive) => {
      setZones(zonesLive);
    });
    const unsubActivity = subscribeActivity((activityLive) => {
      setActivity(activityLive.slice(0, 10));
    });
    const off = onSettingsUpdated((s) => setSettings(s));

    return () => {
      unsubKids?.();
      unsubZones?.();
      unsubActivity?.();
      off?.();
    };
  }, []);

  // Geofencing orchestration: recompute statuses whenever kids or zones change
  useEffect(() => {
    if (!settings.geofencingEnabled) return;
    if (kids.length === 0 || zones.length === 0) return;

    const nowLabel = "Just now";

    // For each kid, find best zone status (inside beats near beats outside)
    kids.forEach(async (kid) => {
      let bestStatus: "safe" | "warning" | "alert" = "alert";
      let inAnyZone = false;

      zones.forEach((zone) => {
        if (!zone.isActive) return;
        const { status } = computeGeofenceStatus(
          kid.latitude,
          kid.longitude,
          zone.latitude,
          zone.longitude,
          zone.radius
        );
        const mapped = statusFromGeofence(status);
        if (mapped === "safe") {
          bestStatus = "safe";
          inAnyZone = true;
        } else if (mapped === "warning" && bestStatus !== "safe") {
          bestStatus = "warning";
        }
      });

      // Only update if status changed
      if (kid.status !== bestStatus) {
        await updateKid(kid.id, { status: bestStatus, lastSeen: nowLabel });
        try {
          await addActivity({
            type: "kid",
            action: "geofence",
            message: `${kid.name} is ${bestStatus === "safe" ? "inside" : bestStatus === "warning" ? "near" : "outside"} zones`,
            kidId: kid.id,
            severity: bestStatus === "alert" ? "warning" : bestStatus === "safe" ? "safe" : "info",
          });
        } catch (e) {
          console.warn("Failed to log geofence activity", e);
        }
      }
    });

    // For each zone, update activeKids count
    zones.forEach(async (zone) => {
      if (!zone.isActive) return;
      const countInside = kids.filter((kid) => {
        const { status } = computeGeofenceStatus(
          kid.latitude,
          kid.longitude,
          zone.latitude,
          zone.longitude,
          zone.radius
        );
        return status === "inside";
      }).length;
      if ((zone.activeKids ?? 0) !== countInside) {
        await updateZone(zone.id, { activeKids: countInside });
      }
    });
  }, [kids, zones]);

  const handleKidUpdated = () => {
    console.log("handleKidUpdated called - refreshing kids list");
    loadKids();
  };

  const handleZoneUpdated = () => {
    loadZones();
    loadActivity();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary-glow/5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                <Badge className="bg-gradient-to-r from-safe-zone to-safe-zone/80 text-white border-0">
                  <Shield className="h-3 w-3 mr-1" />
                  All Kids Safe
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
                  Keep Your Family{" "}
                  <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                    Safe & Connected
                  </span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  Monitor your children's location with smart zone notifications
                  and real-time safety updates.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="zone" size="lg" className="text-base px-8" onClick={() => {
                  // Prefer kid coordinates → zone coordinates → zone address → kid location label → maps home
                  let url = '';
                  const kidWithCoords = kids.find(k => typeof k.latitude === 'number' && typeof k.longitude === 'number');
                  if (kidWithCoords) {
                    url = `https://www.google.com/maps/search/?api=1&query=${kidWithCoords.latitude},${kidWithCoords.longitude}`;
                  } else {
                    const zoneWithCoords = zones.find(z => typeof z.latitude === 'number' && typeof z.longitude === 'number');
                    if (zoneWithCoords) {
                      url = `https://www.google.com/maps/search/?api=1&query=${zoneWithCoords.latitude},${zoneWithCoords.longitude}`;
                    } else {
                      const zoneWithAddress = zones.find(z => z.address && z.address.trim().length > 0);
                      if (zoneWithAddress) {
                        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(zoneWithAddress.address)}`;
                      } else {
                        const kidWithLabel = kids.find(k => k.location && k.location.trim().length > 0);
                        if (kidWithLabel) {
                          url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(kidWithLabel.location)}`;
                        } else {
                          url = 'https://www.google.com/maps';
                        }
                      }
                    }
                  }
                  const w = window.open(url, '_blank', 'noopener,noreferrer');
                  if (!w) {
                    window.location.assign(url);
                  }
                }}>
                  <MapPin className="h-5 w-5" />
                  View Live Map
                </Button>
                <AddZoneModal onZoneAdded={handleZoneUpdated} />
              </div>
            </div>

            <div className="relative">

              <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <QuickStats kids={kids} zones={zones} />
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Kids Overview */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Your Children
                </h2>
                <p className="text-muted-foreground">
                  Real-time location and safety status
                </p>
              </div>
              <AddKidModal onKidAdded={handleKidUpdated} />
            </div>

            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading kids...</p>
                </div>
              ) : kids.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No kids added yet. Add your first child!</p>
                </div>
              ) : (
                kids.map((kid) => (
                  <KidCard key={kid.id} kid={kid} onKidUpdated={handleKidUpdated} />
                ))
              )}
            </div>
          </div>

          {/* Zones Management */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Safety Zones
                </h2>
                <p className="text-muted-foreground">
                  Manage location boundaries and notifications
                </p>
              </div>
              <AddZoneModal onZoneAdded={handleZoneUpdated} />
            </div>

            <div className="space-y-4">
              {zonesLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading zones...</p>
                </div>
              ) : zones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No zones created yet. Create your first zone!</p>
                </div>
              ) : (
                zones.map((zone) => (
                  <ZoneCard key={zone.id} {...zone} onZoneUpdated={handleZoneUpdated} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Card className="border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning-zone" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityLoading ? (
              <div className="text-center py-6 text-muted-foreground">Loading activity...</div>
            ) : activity.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">No recent activity.</div>
            ) : (
              activity.map((item) => {
                const dotColor =
                  item.severity === "danger"
                    ? "bg-danger-zone"
                    : item.severity === "warning"
                    ? "bg-warning-zone"
                    : item.severity === "safe"
                    ? "bg-safe-zone"
                    : "bg-primary";
                const when = (() => {
                  const d = item.createdAt instanceof Date ? item.createdAt : new Date(item.createdAt as unknown as string);
                  const diff = Math.floor((Date.now() - d.getTime()) / 60000);
                  if (diff <= 0) return "Just now";
                  if (diff < 60) return `${diff} minutes ago`;
                  const h = Math.floor(diff / 60);
                  return `${h} hour${h > 1 ? "s" : ""} ago`;
                })();
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className={`h-2 w-2 rounded-full ${dotColor}`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{item.message}</p>
                      <p className="text-sm text-muted-foreground">{when}</p>
                    </div>
                    <Badge variant="outline">{item.severity}</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
      
      <Toaster />
    </div>
  );
};

export default Index;
