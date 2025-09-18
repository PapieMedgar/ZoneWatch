import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus } from "lucide-react";
import { addZone } from "@/lib/firestore";
import { CreateZoneData, ZoneType } from "@/types/zone";
import { useToast } from "@/hooks/use-toast";

interface AddZoneModalProps {
  onZoneAdded: () => void;
}

export function AddZoneModal({ onZoneAdded }: AddZoneModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateZoneData>({
    name: "",
    address: "",
    latitude: undefined,
    longitude: undefined,
    radius: 100,
    type: "home",
    totalKids: 0,
    isActive: true,
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.radius) {
      toast({ title: "Validation error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await addZone(formData);
      toast({ title: "Zone created", description: `${formData.name} has been added.` });
      setOpen(false);
      onZoneAdded();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to create zone", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="safety" className="text-base px-4">
          <Plus className="h-4 w-4" />
          New Zone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Create Safety Zone
          </DialogTitle>
          <DialogDescription>Define a boundary and its type.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address/Description *</Label>
            <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={typeof formData.latitude === "number" ? formData.latitude : ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setFormData({ ...formData, latitude: v === "" ? undefined : parseFloat(v) });
                }}
                placeholder="e.g., 37.4219983"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={typeof formData.longitude === "number" ? formData.longitude : ""}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setFormData({ ...formData, longitude: v === "" ? undefined : parseFloat(v) });
                }}
                placeholder="e.g., -122.084"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Radius (meters) *</Label>
            <Input id="radius" type="number" min={10} value={formData.radius} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Type *</Label>
            <Select value={formData.type} onValueChange={(v: ZoneType) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="home">Home</SelectItem>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Creating..." : "Create Zone"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
