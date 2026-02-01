"use client";

import { useState, useEffect } from "react";
import type { BudgetList, BudgetItem, Tax } from "@/types";
import { saveBudgetList, deleteBudgetList, saveBudgetItem, deleteBudgetItem, setBudgetListTax, saveTax, deleteTax } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2, MoreVertical, Percent } from "lucide-react";
import { format } from "date-fns";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "./ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean);
    if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj);
    }
    return [];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

// Add/Edit Budget List Dialog
function AddEditBudgetListDialog({ list, onSave, trigger }: { list?: BudgetList, onSave: (data: Omit<BudgetList, 'id' | 'createdAt' | 'updatedAt' | 'items'>) => Promise<any>, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(list?.name || "");
    const [description, setDescription] = useState(list?.description || "");
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setName(list?.name || "");
            setDescription(list?.description || "");
        }
    }, [open, list]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await onSave({ name, description });
        if (result.success) {
            toast({ title: "Success", description: `Budget list ${list ? 'updated' : 'created'}.` });
            if (!list) { setName(""); setDescription(""); }
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{list ? "Edit" : "Create"} Budget List</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="list-name">List Name</Label>
                            <Input id="list-name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="list-desc">Description / Requirements</Label>
                            <Textarea id="list-desc" value={description} onChange={e => setDescription(e.target.value)} required />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Save List</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Add/Edit Budget Item Dialog
function AddEditBudgetItemDialog({ listId, item, onSave, trigger }: { listId: string, item?: BudgetItem, onSave: (data: Omit<BudgetItem, 'id'>) => Promise<any>, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(item?.name || "");
    const [price, setPrice] = useState<number | string>(item?.price || "");
    const [quantity, setQuantity] = useState<number | string>(item?.quantity || 1);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setName(item?.name || "");
            setPrice(item?.price || "");
            setQuantity(item?.quantity || 1);
        }
    }, [open, item]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const priceNum = parseFloat(price as string);
        const quantNum = parseInt(quantity as string, 10);
        if (isNaN(priceNum) || priceNum < 0 || isNaN(quantNum) || quantNum < 1) {
            toast({ title: "Invalid Input", description: "Please enter a valid price and quantity.", variant: "destructive" });
            return;
        }

        const result = await onSave({ name, price: priceNum, quantity: quantNum });
        if (result.success) {
            toast({ title: "Success", description: `Item ${item ? 'updated' : 'added'}.` });
            if (!item) { setName(""); setPrice(""); setQuantity(1); }
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{item ? "Edit" : "Add"} Item to Budget List</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="item-name">Item Name</Label>
                            <Input id="item-name" value={name} onChange={e => setName(e.target.value)} required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="item-price">Price per Unit</Label>
                                <Input id="item-price" type="number" value={price} onChange={e => setPrice(e.target.value)} required min="0" step="0.01" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="item-quantity">Quantity</Label>
                                <Input id="item-quantity" type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required min="1" step="1" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Save Item</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// Add/Edit Tax Dialog
function AddEditTaxDialog({ tax, onSave, trigger }: { tax?: Tax, onSave: (data: Omit<Tax, 'id'>) => Promise<any>, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(tax?.name || "");
    const [percentage, setPercentage] = useState<number | string>(tax?.percentage || "");
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setName(tax?.name || "");
            setPercentage(tax?.percentage || "");
        }
    }, [open, tax]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const percNum = parseFloat(percentage as string);
        if (isNaN(percNum) || percNum < 0 || percNum > 100) {
            toast({ title: "Invalid Percentage", description: "Percentage must be between 0 and 100.", variant: "destructive" });
            return;
        }

        const result = await onSave({ name, percentage: percNum });
        if (result.success) {
            toast({ title: "Success", description: `Tax has been ${tax ? 'updated' : 'saved'}.` });
            if (!tax) { setName(""); setPercentage(""); }
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{tax ? "Edit" : "Create"} Tax</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tax-name">Tax Name</Label>
                            <Input id="tax-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. GST" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tax-percentage">Percentage (%)</Label>
                            <Input id="tax-percentage" type="number" value={percentage} onChange={e => setPercentage(e.target.value)} placeholder="e.g. 18" required min="0" max="100" step="0.01" />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Save Tax</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ManageTaxes({ taxes, onSaveTax, onDeleteTax }: { taxes: Tax[], onSaveTax: (data: Omit<Tax, 'id'>, id?: string) => Promise<any>, onDeleteTax: (id: string) => Promise<any> }) {
  return (
    <Accordion type="single" collapsible className="w-full mb-6">
        <AccordionItem value="manage-taxes">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Manage Taxes
                </div>
            </AccordionTrigger>
            <AccordionContent>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardDescription>Add or remove taxes for your budget lists.</CardDescription>
                        <AddEditTaxDialog onSave={(data) => onSaveTax(data)} trigger={<Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>New Tax</Button>} />
                    </CardHeader>
                    <CardContent>
                        {taxes.length === 0 ? (
                            <div className="text-center py-5 text-muted-foreground">No taxes defined yet.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Tax Name</TableHead>
                                        <TableHead>Percentage</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {taxes.map(tax => (
                                        <TableRow key={tax.id}>
                                            <TableCell className="font-medium">{tax.name}</TableCell>
                                            <TableCell>{tax.percentage}%</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <AddEditTaxDialog tax={tax} onSave={(data) => onSaveTax(data, tax.id)} trigger={<Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>} />
                                                <DeleteConfirmationDialog title="Delete Tax?" description={`Are you sure you want to delete the tax "${tax.name}"?`} onDelete={() => onDeleteTax(tax.id)} trigger={<Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </AccordionContent>
        </AccordionItem>
    </Accordion>
  );
}


export function BudgetListView({ initialBudgetLists, initialTaxes }: { initialBudgetLists: BudgetList[], initialTaxes: Tax[] }) {
    const [budgetLists, setBudgetLists] = useState(initialBudgetLists || []);
    const [taxes, setTaxes] = useState(initialTaxes || []);
    const { toast } = useToast();

    useEffect(() => {
        const budgetListsRef = ref(db, 'budgetLists');
        const taxesRef = ref(db, 'taxes');
        const unsubBudgetLists = onValue(budgetListsRef, (snapshot) => {
            setBudgetLists(firebaseObjectToArray<BudgetList>(snapshot.val()) || []);
        });
        const unsubTaxes = onValue(taxesRef, (snapshot) => {
            setTaxes(firebaseObjectToArray<Tax>(snapshot.val()) || []);
        });
        return () => {
            unsubBudgetLists();
            unsubTaxes();
        };
    }, []);
    
    const handleSaveList = (data: Omit<BudgetList, 'id' | 'createdAt' | 'updatedAt' | 'items'>, id?: string) => saveBudgetList(data, id);
    const handleDeleteList = (id: string) => deleteBudgetList(id);
    const handleSaveItem = (listId: string, data: Omit<BudgetItem, 'id'>, itemId?: string) => saveBudgetItem(listId, data, itemId);
    const handleDeleteItem = (listId: string, itemId: string) => deleteBudgetItem(listId, itemId);
    const handleSetTax = (listId: string, taxId: string) => setBudgetListTax(listId, taxId === 'none' ? null : taxId);
    const handleSaveTax = (data: Omit<Tax, 'id'>, id?: string) => saveTax(data, id);
    const handleDeleteTax = (id: string) => deleteTax(id);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold font-headline">Budget Lists</h2>
                    <p className="text-muted-foreground">Create and manage budgets for your requirements.</p>
                </div>
                 <AddEditBudgetListDialog onSave={(data) => handleSaveList(data)} trigger={<Button><PlusCircle className="mr-2 h-4 w-4"/>New List</Button>} />
            </div>

            <ManageTaxes taxes={taxes} onSaveTax={handleSaveTax} onDeleteTax={handleDeleteTax} />

            {budgetLists.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/50 rounded-lg">No budget lists created yet.</div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {budgetLists.map(list => {
                        const subTotal = (list.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
                        const appliedTax = taxes.find(t => t.id === list.taxId);
                        const taxAmount = appliedTax ? subTotal * (appliedTax.percentage / 100) : 0;
                        const grandTotal = subTotal + taxAmount;

                        return (
                        <Card key={list.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{list.name}</CardTitle>
                                        <CardDescription>{list.description}</CardDescription>
                                    </div>
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <AddEditBudgetListDialog list={list} onSave={(data) => handleSaveList(data, list.id)} trigger={<DropdownMenuItem onSelect={e=>e.preventDefault()}>Edit List</DropdownMenuItem>} />
                                            <DeleteConfirmationDialog title="Delete List?" description={`Are you sure you want to delete the list "${list.name}"?`} onDelete={() => handleDeleteList(list.id)} trigger={<DropdownMenuItem onSelect={e=>e.preventDefault()} className="text-destructive">Delete List</DropdownMenuItem>} />
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-[40px] p-0"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(list.items || []).map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">{item.name}<br/><span className="text-xs text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</span></TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.price * item.quantity)}</TableCell>
                                                <TableCell className="p-0 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4"/></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            <AddEditBudgetItemDialog listId={list.id} item={item} onSave={(data) => handleSaveItem(list.id, data, item.id)} trigger={<DropdownMenuItem onSelect={e=>e.preventDefault()}>Edit</DropdownMenuItem>} />
                                                            <DeleteConfirmationDialog title="Delete Item?" description="Are you sure?" onDelete={() => handleDeleteItem(list.id, item.id)} trigger={<DropdownMenuItem onSelect={e=>e.preventDefault()} className="text-destructive">Delete</DropdownMenuItem>} />
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        {(list.items || []).length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center text-muted-foreground h-20">No items in this list.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                            <CardFooter className="flex-col items-stretch !p-4">
                                <div className="flex justify-end mb-4">
                                    <AddEditBudgetItemDialog listId={list.id} onSave={(data) => handleSaveItem(list.id, data)} trigger={<Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" />Add Item</Button>} />
                                </div>
                                <div className="space-y-1 text-sm bg-muted p-3 rounded-lg">
                                    <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subTotal)}</span></div>
                                    <div className="flex justify-between items-center">
                                        <Select value={appliedTax?.id || 'none'} onValueChange={(val) => handleSetTax(list.id, val)}>
                                            <SelectTrigger className="h-7 text-xs w-[120px] font-medium bg-background">
                                                <SelectValue placeholder="Select Tax" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">No Tax</SelectItem>
                                                {taxes.map(tax => <SelectItem key={tax.id} value={tax.id}>{tax.name} ({tax.percentage}%)</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <span>{formatCurrency(taxAmount)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Grand Total</span><span>{formatCurrency(grandTotal)}</span></div>
                                </div>
                                <p className="text-xs text-muted-foreground text-center mt-2">Updated {format(new Date(list.updatedAt), 'PP')}</p>
                            </CardFooter>
                        </Card>
                    )})}
                </div>
            )}
        </div>
    );
}
