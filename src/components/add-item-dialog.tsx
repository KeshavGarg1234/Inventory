
"use client";

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
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import type { NewItemData, ActionResponse } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AddItemDialogProps {
  onAddItem: (item: NewItemData) => Promise<ActionResponse | void>;
}

export function AddItemDialog({ onAddItem }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !description) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill all required fields.",
      });
      return;
    }

    if (imageUrl) {
        try {
            new URL(imageUrl);
        } catch (_) {
            toast({
                variant: "destructive",
                title: "Invalid URL",
                description: "Please enter a valid image URL or leave it empty.",
            });
            return;
        }
    }
    
    setLoading(true);
    
    const newItemData: NewItemData = {
      name,
      description,
      imageUrl: imageUrl || undefined,
    };
    
    try {
      const result = await onAddItem(newItemData);
      
      if (result && !result.success) {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message || "Could not add item.",
        });
      } else {
        toast({
          title: "Success!",
          description: `"${name}" has been added to your inventory.`,
        });
        setName("");
        setDescription("");
        setImageUrl("");
        setOpen(false);
      }
    } catch (error) {
       console.error(error);
       toast({
        variant: "destructive",
        title: "Error adding item",
        description: "Something went wrong. Please try again.",
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-5 w-5" />
          Add New Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Enter the details for a new category of item in your inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., HP Laptop"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="Item details and specifications"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                Image URL
              </Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="col-span-3"
                placeholder="Optional: https://..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={loading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
