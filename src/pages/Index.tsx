import { useState, useEffect } from "react";
import { Navbar } from "@/components/NavBar";
import { QuickStats } from "@/components/QuickStats";
import { KidCard } from "@/components/KidCard";
import { ZoneCard } from "@/components/ZoneCard";
import { AddKidModal } from "@/components/AddKidModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Users, Shield, AlertTriangle } from "lucide-react";
import { getKids } from "@/lib/firestore";
import { Kid } from "@/types/kids";
import { Toaster } from "@/components/ui/toaster";



const mockZones = [
  {
    name: "Home Safe Zone",
    address: "1234 Maple Street, Springfield",
    radius: 100,
    type: "home" as const,
    activeKids: 1,
    totalKids: 3,
    createdAt: "2 weeks ago",
    isActive: true,
  },
  {
    name: "Lincoln Elementary",
    address: "567 Oak Avenue, Springfield",
    radius: 150,
    type: "school" as const,
    activeKids: 1,
    totalKids: 2,
    createdAt: "1 month ago",
    isActive: true,
  },
  {
    name: "Grandma's House",
    address: "890 Pine Street, Springfield",
    radius: 75,
    type: "custom" as const,
    activeKids: 0,
    totalKids: 3,
    createdAt: "3 weeks ago",
    isActive: true,
  },
];

const Index = () => {
  const [kids, setKids] = useState<Kid[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    loadKids();
  }, []);

  const handleKidUpdated = () => {
    console.log("handleKidUpdated called - refreshing kids list");
    loadKids();
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
                <Button variant="zone" size="lg" className="text-base px-8">
                  <MapPin className="h-5 w-5" />
                  View Live Map
                </Button>
                <Button variant="safety" size="lg" className="text-base px-8">
                  <Plus className="h-5 w-5" />
                  Create New Zone
                </Button>
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
        <QuickStats />
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
              <Button variant="safety">
                <Plus className="h-4 w-4" />
                New Zone
              </Button>
            </div>

            <div className="space-y-4">
              {mockZones.map((zone, index) => (
                <ZoneCard key={index} {...zone} />
              ))}
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
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-warning-zone"></div>
              <div className="flex-1">
                <p className="font-medium">Jake approaching zone boundary</p>
                <p className="text-sm text-muted-foreground">
                  Maple Street Park - 2 minutes ago
                </p>
              </div>
              <Badge variant="outline">Warning</Badge>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-safe-zone"></div>
              <div className="flex-1">
                <p className="font-medium">Emma arrived at school</p>
                <p className="text-sm text-muted-foreground">
                  Lincoln Elementary - 1 hour ago
                </p>
              </div>
              <Badge className="bg-safe-zone text-white border-0">Safe</Badge>
            </div>

            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div className="h-2 w-2 rounded-full bg-safe-zone"></div>
              <div className="flex-1">
                <p className="font-medium">Sofia entered home zone</p>
                <p className="text-sm text-muted-foreground">
                  Home Safe Zone - 2 hours ago
                </p>
              </div>
              <Badge className="bg-safe-zone text-white border-0">Safe</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
      
      <Toaster />
    </div>
  );
};

export default Index;
