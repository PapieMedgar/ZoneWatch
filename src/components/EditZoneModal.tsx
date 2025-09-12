import { useEffect, useState } from "react";
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
import { Settings } from "lucide-react";
import { updateZone } from "@/lib/firestore";
import { Zone, ZoneType, UpdateZoneData } from "@/types/zone";
import { useToast } from "@/hooks/use-toast";

interface EditZoneModalProps {
  zone: Zone;
  onZoneUpdated: () => void;
  asIcon?: boolean;
}

export function EditZoneModal({ zone, onZoneUpdated, asIcon = false }: EditZoneModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateZoneData>({
    name: zone.name,
    address: zone.address,
    radius: zone.radius,
    type: zone.type,
    totalKids: zone.totalKids,
    isActive: zone.isActive,
  });
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      name: zone.name,
      address: zone.address,
      radius: zone.radius,
      type: zone.type,
      totalKids: zone.totalKids,
      isActive: zone.isActive,
    });
  }, [zone]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.radius) return;
    setLoading(true);
    try {
      await updateZone(zone.id, formData);
      toast({ title: "Zone updated", description: `${formData.name} saved.` });
      setOpen(false);
      onZoneUpdated();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to update zone", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {asIcon ? (
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">Edit Zone</Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit Zone</DialogTitle>
          <DialogDescription>Update this safety zone configuration.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={formData.name || ""} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address/Description</Label>
            <Input id="address" value={formData.address || ""} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="radius">Radius (meters)</Label>
            <Input id="radius" type="number" min={10} value={formData.radius || 0} onChange={(e) => setFormData({ ...formData, radius: Number(e.target.value) || 0 })} />
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
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
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


