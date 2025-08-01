
"use client";

import { useState, useEffect, ReactNode, useTransition } from "react";
import { useRouter, notFound, useSearchParams } from "next/navigation";
import type { Item, SubItem, AvailabilityStatus } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QrCodeDisplay } from "@/components/qr-code-display";
import { AllotItemDialog } from "@/components/allot-item-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Trash2, QrCode, Phone, User, Briefcase, MoreVertical, VenetianMask, Undo, UserX, HandPlatter, Archive, Package, PackageCheck, PackageX, Edit, ImageIcon, Receipt, Building, Info, Type, PlusCircle, Circle, Calendar as CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { updateItem, deleteItem, updateSubItem, deleteSubItem, allotSubItem, addUnitsToItem } from '@/app/actions';
import { Calendar } from "@/components/ui/calendar";

const statusConfig: Record<AvailabilityStatus, { icon: React.ElementType; color: string; label: string }> = {
  Available: { icon: CheckCircle, color: "text-green-500", label: "Available" },
  "In Use": { icon: Circle, color: "text-blue-500", label: "In Use" },
  Discarded: { icon: Trash2, color: "text-red-500", label: "Discarded" },
};

function UnitDetailDialog({ item, subItem, open, onOpenChange }: { item: Item, subItem: SubItem, open: boolean, onOpenChange: (open: boolean) => void }) {
    const StatusInfo = ({ subItem }: { subItem: SubItem }) => {
        if (subItem.availabilityStatus === 'In Use' && subItem.assignedTo) {
            return (
                <div className="grid gap-2 text-sm mt-2">
                    <h5 className="font-semibold mt-2 border-t pt-2">Assignment Details</h5>
                    <div className="flex items-center gap-2"><VenetianMask className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.personId}</span></div>
                    <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.name}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.phone}</span></div>
                    {subItem.assignedTo.department && <div className="flex items-center gap-2"><Building className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.department}</span></div>}
                    {subItem.assignedTo.project && <div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground" /> <span>{subItem.assignedTo.project}</span></div>}
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> <span>Assigned on {format(parseISO(subItem.assignedTo.assignmentDate), "PPP")}</span></div>
                </div>
            )
        }
        if (subItem.availabilityStatus === 'Discarded' && subItem.discardedDate) {
            return (
                 <div className="grid gap-2 text-sm mt-2">
                    <h5 className="font-semibold mt-2 border-t pt-2">Discard Details</h5>
                    <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" /> <span>Discarded on {format(parseISO(subItem.discardedDate), "PPP")}</span></div>
                </div>
            )
        }
        return null;
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unit Details: <span className="font-mono text-lg">{subItem.id}</span></DialogTitle>
                    <DialogDescription>
                        Current information for this specific unit of "{item.name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-2">
                    <p><strong>Item Name:</strong> {item.name}</p>
                    <p><strong>Bill Number:</strong> {subItem.billNumber || 'N/A'}</p>
                    <div className="flex items-center gap-2">
                        <strong>Status:</strong>
                        <span className={cn("flex items-center gap-1", statusConfig[subItem.availabilityStatus].color)}>
                           {React.createElement(statusConfig[subItem.availabilityStatus].icon, { className: "h-4 w-4" })}
                           {statusConfig[subItem.availabilityStatus].label}
                        </span>
                    </div>
                    <StatusInfo subItem={subItem} />
                </div>
                 <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Close</Button>
                    </DialogClose>
                 </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function UnitDetailTrigger({ item, subItem }: { item: Item; subItem: SubItem }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Info className="h-5 w-5" />
      </Button>
      {open && (
        <UnitDetailDialog
          item={item}
          subItem={subItem}
          open={open}
          onOpenChange={setOpen}
        />
      )}
    </>
  );
}

function EditNameDialog({ open, onOpenChange, itemName, onNameChange, handleSubmit }: { open: boolean, onOpenChange: (open: boolean) => void, itemName: string, onNameChange: (name: string) => void, handleSubmit: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <DialogHeader>
            <DialogTitle>Change Name</DialogTitle>
            <DialogDescription>
              Enter a new name for the item.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Item Name</Label>
            <Input
              id="name"
              value={itemName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., HP Laptop"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


function EditItemDialog({ item, onUpdate, trigger }: { item: Item, onUpdate: (updatedData: Partial<Item>) => Promise<void>, trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(item.description);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description) {
      toast({
        title: "Error",
        description: "Description cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    await onUpdate({ description });
    toast({
      title: "Success!",
      description: "Item description has been updated.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>
              Update the description for "{item.name}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="description" className="sr-only">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 min-h-[120px]"
              placeholder="Item details and specifications"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditImageDialog({ item, onUpdate, trigger }: { item: Item, onUpdate: (updatedData: Partial<Item>) => Promise<void>, trigger: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (imageUrl) new URL(imageUrl);
        } catch (_) {
            toast({
                title: "Invalid URL",
                description: "Please enter a valid image URL.",
                variant: "destructive",
            });
            return;
        }
        await onUpdate({ imageUrl: imageUrl || undefined });
        toast({
            title: "Success!",
            description: "Item image has been updated.",
        });
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Change Image</DialogTitle>
                        <DialogDescription>
                            Enter a new image URL for "{item.name}".
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="imageUrl">Image URL</Label>
                        <Input
                            id="imageUrl"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.png"
                        />
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save Image</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditBillDialog({ subItem, onUpdate, trigger }: { subItem: SubItem; onUpdate: (updatedSubItem: SubItem) => Promise<void>; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [billNumber, setBillNumber] = useState(subItem.billNumber || "");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber) {
      toast({
        title: "Error",
        description: "Bill number is required.",
        variant: "destructive",
      });
      return;
    }
    await onUpdate({
      ...subItem,
      billNumber,
    });
    toast({
      title: "Success!",
      description: "Bill information has been updated.",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bill Information</DialogTitle>
            <DialogDescription>
              Update the bill number for unit {subItem.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="billNumber" className="text-right">Bill No.</Label>
              <Input
                id="billNumber"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddUnitsDialog({ itemId, onUnitsAdd }: { itemId: string, onUnitsAdd: (data: { itemId: string; quantity: number; billNumber: string; billDate: string; company: string;}) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [billNumber, setBillNumber] = useState("");
  const [company, setCompany] = useState("");
  const [billDate, setBillDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity < 1 || !billNumber || !billDate || !company) {
      toast({
        title: "Error",
        description: "Please fill all fields: Quantity, Bill Number, Bill Date, and Company.",
        variant: "destructive",
      });
      return;
    }

    await onUnitsAdd({
      itemId,
      quantity,
      billNumber,
      company,
      billDate: billDate.toISOString(),
    });

    toast({
      title: "Success!",
      description: `${quantity} new unit(s) have been added.`,
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add More Units
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add More Units</DialogTitle>
            <DialogDescription>Add new units to this item by providing the purchase details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="billNumber" className="text-right">Bill No.</Label>
              <Input
                id="billNumber"
                value={billNumber}
                onChange={(e) => setBillNumber(e.target.value)}
                className="col-span-3"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company" className="text-right">Company</Label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Bill Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "col-span-3 justify-start text-left font-normal",
                      !billDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {billDate ? format(billDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={billDate}
                    onSelect={setBillDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Units</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function PageContent({ itemData }: { itemData: Item | undefined }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();
    
    const [item, setItem] = useState<Item | undefined>(itemData);
    const [scannedUnit, setScannedUnit] = useState<SubItem | null>(null);
    const [isScannedUnitDialogOpen, setIsScannedUnitDialogOpen] = useState(false);
    const [isEditNameOpen, setIsEditNameOpen] = useState(false);
    const [editedName, setEditedName] = useState("");

    useEffect(() => {
        setItem(itemData);
        if (itemData) {
            setEditedName(itemData.name);
        }
    }, [itemData]);

    useEffect(() => {
        if (item) {
            const unitId = searchParams.get('unitId');
            if (unitId) {
                const unit = item.subItems.find(si => si.id === unitId);
                if (unit) {
                    setScannedUnit(unit);
                    setIsScannedUnitDialogOpen(true);
                } else {
                     toast({
                        title: "Unit Not Found",
                        description: `The scanned unit ID "${unitId}" does not belong to this item.`,
                        variant: "destructive"
                    });
                }
            }
        }
    }, [item, searchParams, toast]);

    if (!item) {
        return notFound();
    }

    const optimisticUpdate = (updatedItem: Item) => {
      setItem(updatedItem);
    }
  
    const handleItemDelete = async () => {
        await deleteItem(item.id);
        toast({
          title: "Item Deleted",
          description: `"${item.name}" has been removed from your inventory.`,
        });
        router.push("/");
    };

    const handleItemUpdate = async (updatedData: Partial<Item>) => {
        const updatedItem = { ...item, ...updatedData };
        optimisticUpdate(updatedItem);
        await updateItem(item.id, updatedData);
    };

    const handleNameUpdate = async () => {
        if (!editedName) {
            toast({
                title: "Error",
                description: "Item name cannot be empty.",
                variant: "destructive",
            });
            return;
        }
        await handleItemUpdate({ name: editedName });
        toast({
            title: "Success!",
            description: "Item name has been updated.",
        });
        setIsEditNameOpen(false);
    };

    const handleSubItemUpdate = async (updatedSubItem: SubItem) => {
        const updatedItems = item.subItems.map(si => si.id === updatedSubItem.id ? updatedSubItem : si);
        const updatedItem = { ...item, subItems: updatedItems };
        optimisticUpdate(updatedItem);
        await updateSubItem(item.id, updatedSubItem);
    };

    const handleSubItemDelete = async (subItemIdToDelete: string) => {
        const updatedSubItems = item.subItems.filter(si => si.id !== subItemIdToDelete);
        const updatedItem = { ...item, subItems: updatedSubItems, totalQuantity: updatedSubItems.length };
        optimisticUpdate(updatedItem);
        await deleteSubItem(item.id, subItemIdToDelete);
        toast({
          title: "Unit Deleted",
          description: `The unit has been successfully removed.`,
        });
    };

    const handleAddUnits = async (data: { itemId: string; quantity: number; billNumber: string; billDate: string; company: string;}) => {
        await addUnitsToItem(data);
    };

    const handleDiscardSubItem = async (subItemToDiscard: SubItem) => {
        const updatedSubItem: SubItem = {
          ...subItemToDiscard,
          availabilityStatus: "Discarded",
          discardedDate: new Date().toISOString(),
          assignedTo: undefined,
        };
        await handleSubItemUpdate(updatedSubItem);
        toast({
          title: "Unit Discarded",
          description: `Unit ${subItemToDiscard.id} has been marked as discarded.`,
        });
    };

    const handleUndiscardSubItem = async (subItemToUndiscard: SubItem) => {
        const updatedSubItem: SubItem = {
          ...subItemToUndiscard,
          availabilityStatus: "Available",
          discardedDate: undefined,
          assignedTo: undefined,
        };
        await handleSubItemUpdate(updatedSubItem);
        toast({
          title: "Unit Restored",
          description: `Unit ${subItemToUndiscard.id} has been restored to available.`,
        });
    };
    
    const handleUnallotSubItem = async (subItemToUnallot: SubItem) => {
        const updatedSubItem: SubItem = {
          ...subItemToUnallot,
          availabilityStatus: "Available",
          assignedTo: undefined,
        };
        await handleSubItemUpdate(updatedSubItem);
        toast({
          title: "Unit Unallotted",
          description: `Unit ${subItemToUnallot.id} is now available.`,
        });
    };

    const handleAllotSubItem = async (subItem: SubItem, assignmentDetails: NonNullable<SubItem['assignedTo']>) => {
        const updatedSubItem: SubItem = {
          ...subItem,
          availabilityStatus: "In Use",
          assignedTo: assignmentDetails,
        };

        const updatedItems = item.subItems.map(si => si.id === subItem.id ? updatedSubItem : si);
        const updatedItem = { ...item, subItems: updatedItems };
        optimisticUpdate(updatedItem);

        await allotSubItem(subItem, assignmentDetails);
        toast({
            title: "Unit Allotted",
            description: `Unit has been successfully allotted to ${assignmentDetails.name}.`,
        });
    };

    const StatusDisplay = ({ subItem }: { subItem: SubItem }) => {
        const config = statusConfig[subItem.availabilityStatus];
        const isClickable = subItem.availabilityStatus === "In Use" || subItem.availabilityStatus === "Discarded";

        const content = (
        <div className="flex items-center gap-2">
            <config.icon className={cn("h-4 w-4", config.color)} />
            <span>{config.label}</span>
        </div>
        );

        if (!isClickable) {
        return content;
        }

        return (
        <Popover>
            <PopoverTrigger asChild>
            <button className="cursor-pointer">{content}</button>
            </PopoverTrigger>
            <PopoverContent className="w-80" side="top" align="start">
            <div className="grid gap-4">
                <div className="space-y-2">
                <h4 className="font-medium leading-none">{subItem.availabilityStatus === "In Use" ? "Assigned To" : "Discarded Details"}</h4>
                <p className="text-sm text-muted-foreground">
                    {subItem.availabilityStatus === "In Use" ? "Information about the current user." : "Date the item was discarded."}
                </p>
                </div>
                {subItem.availabilityStatus === 'In Use' && subItem.assignedTo && (
                <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2">
                    <VenetianMask className="h-4 w-4 text-muted-foreground" />
                    <span>{subItem.assignedTo.personId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{subItem.assignedTo.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{subItem.assignedTo.phone}</span>
                    </div>
                    {subItem.assignedTo.department && (
                        <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{subItem.assignedTo.department}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{format(parseISO(subItem.assignedTo.assignmentDate), "PPP")}</span>
                    </div>
                    {subItem.assignedTo.project && (
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span>{subItem.assignedTo.project}</span>
                        </div>
                    )}
                </div>
                )}
                {subItem.availabilityStatus === 'Discarded' && subItem.discardedDate && (
                    <div className="flex items-center gap-2 text-sm">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{format(parseISO(subItem.discardedDate), "PPP")}</span>
                    </div>
                )}
            </div>
            </PopoverContent>
        </Popover>
        );
    };

    const getQrDataForSubItem = (subItem: SubItem): string => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/item/${item.id}?unitId=${subItem.id}`;
        }
        return `/item/${item.id}?unitId=${subItem.id}`;
    };
    
    const getImageDataAiHint = (itemName: string) => {
        return itemName.split(" ").slice(0, 2).join(" ").toLowerCase();
    };

    const availableCount = item.subItems.filter(si => si.availabilityStatus === 'Available').length;
    const inUseCount = item.subItems.filter(si => si.availabilityStatus === 'In Use').length;
    const discardedCount = item.subItems.filter(si => si.availabilityStatus === 'Discarded').length;

    return (
        <div className="container mx-auto p-4 md:p-8">
            {scannedUnit && (
                <UnitDetailDialog 
                    item={item} 
                    subItem={scannedUnit} 
                    open={isScannedUnitDialogOpen} 
                    onOpenChange={(open) => {
                        setIsScannedUnitDialogOpen(open);
                        if (!open) {
                            router.replace(`/item/${item.id}`, { scroll: false });
                        }
                    }}
                />
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                <div className="lg:col-span-2">
                    <Card className="relative">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-4xl font-bold font-headline">{item.name}</CardTitle>
                                    <CardDescription className="text-lg text-muted-foreground mt-2">{item.description}</CardDescription>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onSelect={() => { setEditedName(item.name); setIsEditNameOpen(true); }}>
                                            <Type className="mr-2 h-4 w-4" /> Change Name
                                        </DropdownMenuItem>
                                        <EditImageDialog item={item} onUpdate={handleItemUpdate} trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <ImageIcon className="mr-2 h-4 w-4" /> Change Image
                                            </DropdownMenuItem>
                                        }/>
                                        <EditItemDialog item={item} onUpdate={handleItemUpdate} trigger={
                                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Edit className="mr-2 h-4 w-4" /> Change Description
                                            </DropdownMenuItem>
                                        }/>
                                        <DropdownMenuSeparator />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-500">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Item
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the item and all of its associated data.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={handleItemDelete}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardHeader>
                        <CardContent>
                        {/* Content can be added here if needed */}
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 overflow-hidden rounded-lg shadow-lg aspect-video">
                    <img 
                        src={item.imageUrl || `https://placehold.co/400x300.png`}
                        alt={item.name} 
                        className="object-cover w-full h-full"
                        data-ai-hint={getImageDataAiHint(item.name)}
                    />
                </div>
            </div>

            <EditNameDialog 
                open={isEditNameOpen}
                onOpenChange={setIsEditNameOpen}
                itemName={editedName}
                onNameChange={setEditedName}
                handleSubmit={handleNameUpdate}
            />
            
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="font-headline">Inventory Summary</CardTitle>
                    <CardDescription>Overview of all units for this item.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <Archive className="h-8 w-8 mb-2 text-primary"/>
                        <p className="text-3xl font-bold">{item.totalQuantity}</p>
                        <p className="text-sm text-muted-foreground">Total Units</p>
                    </div>
                     <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <PackageCheck className="h-8 w-8 mb-2 text-green-500"/>
                        <p className="text-3xl font-bold text-green-500">{availableCount}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <Package className="h-8 w-8 mb-2 text-blue-500"/>
                        <p className="text-3xl font-bold text-blue-500">{inUseCount}</p>
                        <p className="text-sm text-muted-foreground">In Use</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary/50 flex flex-col items-center justify-center">
                        <PackageX className="h-8 w-8 mb-2 text-red-500"/>
                        <p className="text-3xl font-bold text-red-500">{discardedCount}</p>
                        <p className="text-sm text-muted-foreground">Discarded</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Individual Units</CardTitle>
                        <CardDescription>A detailed list of all units for this item.</CardDescription>
                    </div>
                    <AddUnitsDialog itemId={item.id} onUnitsAdd={handleAddUnits} />
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Unit ID</TableHead>
                                    <TableHead>Bill No.</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                    <TableHead className="text-right">QR/Info</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {item.subItems.map((subItem) => (
                                <TableRow key={subItem.id}>
                                    <TableCell className="font-mono text-xs">{subItem.id}</TableCell>
                                    <TableCell>{subItem.billNumber || 'N/A'}</TableCell>
                                    <TableCell>
                                        <StatusDisplay subItem={subItem} />
                                    </TableCell>
                                    <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5" />
                                        </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                        {subItem.availabilityStatus === 'Available' && (
                                            <AllotItemDialog 
                                                subItem={subItem} 
                                                onAllot={handleAllotSubItem}
                                                trigger={
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                        <HandPlatter className="mr-2 h-4 w-4"/> Allot Unit
                                                    </DropdownMenuItem>
                                                }
                                            />
                                        )}
                                        {subItem.availabilityStatus === 'In Use' && (
                                            <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <UserX className="mr-2 h-4 w-4"/> Unallot Unit
                                                </DropdownMenuItem>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                <AlertDialogTitle>Unallot this unit?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will mark the unit as available again and remove assignment details.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleUnallotSubItem(subItem)}>Unallot</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                            </AlertDialog>
                                        )}
                                            
                                            {subItem.availabilityStatus === 'Discarded' ? (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Undo className="mr-2 h-4 w-4"/> Undiscard Unit
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Restore this unit?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will mark the unit as available again.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleUndiscardSubItem(subItem)}>Restore</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            ) : (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={subItem.availabilityStatus === 'In Use'}>
                                                            <Trash2 className="mr-2 h-4 w-4"/> Discard Unit
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Discard this unit?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This will mark the unit as discarded. This action can be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDiscardSubItem(subItem)}>Discard</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                            
                                            <DropdownMenuSeparator />
                                            
                                            <EditBillDialog 
                                            subItem={subItem}
                                            onUpdate={handleSubItemUpdate}
                                            trigger={
                                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                <Receipt className="mr-2 h-4 w-4" /> Edit Bill Info
                                                </DropdownMenuItem>
                                            }
                                            />

                                            <DropdownMenuSeparator />

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600 focus:text-red-500">
                                                        <Trash2 className="mr-2 h-4 w-4"/> Delete Unit
                                                    </DropdownMenuItem>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete this unit?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This action cannot be undone. This will permanently delete this unit from the inventory.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleSubItemDelete(subItem.id)}>Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    </TableCell>
                                    <TableCell className="text-right space-x-1">
                                        <UnitDetailTrigger item={item} subItem={subItem} />
                                        <Popover>
                                            <PopoverTrigger asChild>
                                            <Button variant="ghost" size="icon">
                                                <QrCode className="h-5 w-5" />
                                            </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto" side="top" align="end">
                                            <QrCodeDisplay data={getQrDataForSubItem(subItem)} />
                                            </PopoverContent>
                                        </Popover>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
