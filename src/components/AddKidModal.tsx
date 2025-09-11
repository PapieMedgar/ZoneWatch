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
import { Plus, User } from "lucide-react";
import { addKid } from "@/lib/firestore";
import { CreateKidData } from "@/types/kids";
import { useToast } from "@/hooks/use-toast";

interface AddKidModalProps {
  onKidAdded: () => void;
}

export function AddKidModal({ onKidAdded }: AddKidModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateKidData>({
    name: "",
    age: 0,
    location: "",
    avatar: "",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.location || formData.age <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields with valid data.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Adding kid:", formData);
      const kidId = await addKid(formData);
      console.log("Kid added with ID:", kidId);
      toast({
        title: "Success!",
        description: `${formData.name} has been added successfully.`,
      });
      setFormData({ name: "", age: 0, location: "", avatar: "" });
      setOpen(false);
      console.log("Calling onKidAdded callback");
      onKidAdded();
    } catch (error) {
      console.error("Error adding kid:", error);
      toast({
        title: "Error",
        description: "Failed to add kid profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateKidData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Kid Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Add New Kid Profile
          </DialogTitle>
          <DialogDescription>
            Create a new profile for your child to start monitoring their safety.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Child's Name *</Label>
            <Input
              id="name"
              value={formData.name}
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
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="e.g., Home, School, Park"
              required
            />
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
              {loading ? "Adding..." : "Add Kid Profile"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
