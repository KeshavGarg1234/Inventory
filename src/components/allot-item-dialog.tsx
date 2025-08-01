
"use client";

import { useState, type ReactNode } from "react";
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
import type { SubItem } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface AllotItemDialogProps {
  subItem: SubItem;
  onAllot: (subItem: SubItem, assignmentDetails: NonNullable<SubItem['assignedTo']>) => Promise<void>;
  trigger: ReactNode;
}

export function AllotItemDialog({ subItem, onAllot, trigger }: AllotItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [personId, setPersonId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [project, setProject] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId || !name || !phone) {
      toast({
        title: "Error",
        description: "Please fill all required fields (ID, Name, Phone).",
        variant: "destructive",
      });
      return;
    }

    if (phone.length !== 10) {
       toast({
        title: "Invalid Phone Number",
        description: "Phone number must be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }

    const assignmentDetails: NonNullable<SubItem['assignedTo']> = {
      personId,
      name,
      phone,
      department: department || undefined,
      project: project || undefined,
      assignmentDate: new Date().toISOString(),
    };

    await onAllot(subItem, assignmentDetails);
    
    // Reset form and close dialog
    setPersonId("");
    setName("");
    setPhone("");
    setDepartment("");
    setProject("");
    setOpen(false);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Allot Item</DialogTitle>
            <DialogDescription>
              Assign this unit to a person. Enter their details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="personId" className="text-right">
                Person ID
              </Label>
              <Input
                id="personId"
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="col-span-3"
                placeholder="e.g., EMP-001 or Student ID"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., John Doe"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className="col-span-3"
                placeholder="10-digit phone number"
                maxLength={10}
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">
                Department
              </Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="col-span-3"
                placeholder="Optional: e.g., Engineering"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="project" className="text-right">
                Project
              </Label>
              <Input
                id="project"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="col-span-3"
                placeholder="Optional: Project name"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Allot Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
