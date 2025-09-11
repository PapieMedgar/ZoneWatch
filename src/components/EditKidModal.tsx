import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit, User } from "lucide-react";
import { updateKid } from "@/lib/firestore";
import { Kid, UpdateKidData } from "@/types/kids";
import { useToast } from "@/hooks/use-toast";

interface EditKidModalProps {
  kid: Kid;
  onKidUpdated: () => void;
}

export function EditKidModal({ kid, onKidUpdated }: EditKidModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateKidData>({
    name: kid.name,
    age: kid.age,
    location: kid.location,
    avatar: kid.avatar || "",
    status: kid.status,
  });
  const { toast } = useToast();

  useEffect(() => {
    setFormData({
      name: kid.name,
      age: kid.age,
      location: kid.location,
      avatar: kid.avatar || "",
      status: kid.status,
    });
  }, [kid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || !formData.age || formData.age <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateKid(kid.id, formData);
      toast({
        title: "Success!",
        description: `${formData.name}'s profile has been updated successfully.`,
      });
      setOpen(false);
      onKidUpdated();
    } catch (error) {
      console.error("Error updating kid:", error);
      toast({
        title: "Error",
        description: "Failed to update kid profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateKidData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Edit className="h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Kid Profile
          </DialogTitle>
          <DialogDescription>
            Update the information for {kid.name}'s profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Child's Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter child's full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="age">Age *</Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="18"
              value={formData.age || ""}
              onChange={(e) => handleInputChange("age", parseInt(e.target.value) || 0)}
              placeholder="Enter child's age"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Current Location *</Label>
            <Input
              id="location"
              value={formData.location || ""}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Home, School, Park"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "safe" | "warning" | "alert") => 
                handleInputChange("status", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="safe">Safe in Zone</SelectItem>
                <SelectItem value="warning">Near Boundary</SelectItem>
                <SelectItem value="alert">Outside Zone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="avatar">Avatar URL (Optional)</Label>
            <Input
              id="avatar"
              value={formData.avatar || ""}
              onChange={(e) => handleInputChange("avatar", e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
