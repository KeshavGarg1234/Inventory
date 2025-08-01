
"use client";

import { useState, useEffect, ReactNode } from 'react';
import { useRouter, notFound } from 'next/navigation';
import type { Bill, Item, SubItem } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Edit, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateBill, addItemToBill, removeItemFromBill } from '@/app/actions';

function EditBillDialog({ bill, onUpdate }: { bill: Bill, onUpdate: (originalBillNumber: string, updatedBill: Bill) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [billNumber, setBillNumber] = useState(bill.billNumber);
  const [company, setCompany] = useState(bill.company);
  const [billDate, setBillDate] = useState<Date | undefined>(parseISO(bill.billDate));
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billNumber || !company || !billDate) {
      toast({
        title: "Error",
        description: "Bill number, company name and bill date are required.",
        variant: "destructive",
      });
      return;
    }

    await onUpdate(bill.billNumber, {
      ...bill,
      billNumber,
      company,
      billDate: billDate.toISOString(),
    });

    toast({
      title: "Success!",
      description: `Bill ${bill.billNumber} has been updated.`,
    });
    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      setBillNumber(bill.billNumber);
      setCompany(bill.company);
      setBillDate(parseISO(bill.billDate));
    }
  }, [open, bill]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Bill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Bill Details</DialogTitle>
            <DialogDescription>Update the information for this bill.</DialogDescription>
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
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddItemToBillDialog({ billNumber, allItems, onAddItem }: { billNumber: string, allItems: Item[], onAddItem: (itemId: string, quantity: number) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity < 1) {
      toast({
        title: "Error",
        description: "Please select an item and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }
    await onAddItem(selectedItemId, quantity);
    toast({
      title: "Success",
      description: "Item(s) added to the bill.",
    });
    setOpen(false);
    setSelectedItemId('');
    setQuantity(1);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item to Bill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Item to Bill</DialogTitle>
            <DialogDescription>Select an existing item from your inventory to add to bill #{billNumber}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item" className="text-right">Item</Label>
              <Select onValueChange={setSelectedItemId} value={selectedItemId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {allItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">Cancel</Button>
            </DialogClose>
            <Button type="submit">Add Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type BillDetailPageProps = {
    bill: Bill | undefined;
    items: Item[];
};

export function BillDetailView({ bill: initialBill, items: initialItems }: BillDetailPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [bill, setBill] = useState(initialBill);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setBill(initialBill);
    setItems(initialItems);
  }, [initialBill, initialItems]);

  if (!bill) {
    notFound();
  }

  const billItems = items.map(item => {
    const relevantSubItems = item.subItems.filter(si => si.billNumber === bill.billNumber);
    return {
      ...item,
      subItemCount: relevantSubItems.length,
    };
  }).filter(item => item.subItemCount > 0);

  const handleUpdateBill = async (originalBillNumber: string, updatedBillData: Bill) => {
    await updateBill(originalBillNumber, updatedBillData);
    if (originalBillNumber !== updatedBillData.billNumber) {
      router.replace(`/bills/${encodeURIComponent(updatedBillData.billNumber)}`);
    }
  };

  const handleAddItemToBill = async (itemId: string, quantity: number) => {
    if (bill) {
        await addItemToBill(itemId, bill.billNumber, quantity);
    }
  };

  const handleRemoveItemFromBill = async (itemId: string) => {
    const billNumber = bill?.billNumber;
    if (!billNumber) return;

    const itemToRemove = billItems.find(i => i.id === itemId);
    if (itemToRemove) {
        await removeItemFromBill(itemId, billNumber);
        toast({
            title: "Items Removed",
            description: `${itemToRemove.subItemCount} unit(s) of "${itemToRemove.name}" were removed from this bill.`
        });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Bill Details</h1>
          <p className="text-muted-foreground">Information for bill #{bill.billNumber}</p>
        </div>
        <div className="flex gap-2">
            <AddItemToBillDialog billNumber={bill.billNumber} allItems={items} onAddItem={handleAddItemToBill} />
            <EditBillDialog bill={bill} onUpdate={handleUpdateBill} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Bill Number</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{bill.billNumber}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Company</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{bill.company}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Bill Date</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{format(parseISO(bill.billDate), 'PPP')}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Items on this Bill</CardTitle>
          <CardDescription>A list of all inventory items purchased under this bill.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {billItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.subItemCount}</TableCell>
                  <TableCell className="text-right space-x-2">
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm">
                              <Trash2 className="mr-2 h-4 w-4" /> Remove
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will remove all {item.subItemCount} units of "{item.name}" from this bill. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleRemoveItemFromBill(item.id)}>Remove</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Link href={`/item/${item.id}`} passHref>
                      <Button variant="outline" size="sm">View Item</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
               {billItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No items have been added to this bill yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
