
"use client";

import { useState, useEffect } from 'react';
import { notFound, useRouter } from 'next/navigation';
import type { User, Item } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Edit, Building } from 'lucide-react';
import { updateUser } from '@/app/actions';

type AllottedItem = {
    itemName: string;
    itemId: string;
    subItemId: string;
    assignmentDate: string;
    project?: string;
}

function EditUserDialog({ user, onUpdate }: { user: User, onUpdate: (updatedUser: User) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [department, setDepartment] = useState(user.department || "");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      toast({
        title: "Error",
        description: "Name and phone number are required.",
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

    await onUpdate({
      ...user,
      name,
      phone,
      department: department || undefined,
    });

    toast({
      title: "Success!",
      description: `User ${user.name} has been updated.`,
    });
    setOpen(false);
  };
  
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 10) {
      setPhone(value);
    }
  };

  useEffect(() => {
      if (open) {
          setName(user.name);
          setPhone(user.phone);
          setDepartment(user.department || "");
      }
  }, [open, user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit User
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit User Details</DialogTitle>
            <DialogDescription>Update the information for {user.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department</Label>
              <Input
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
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

type UserDetailPageProps = {
    user: User | undefined;
    items: Item[];
};

export function UserDetailView({ user: initialUser, items: initialItems }: UserDetailPageProps) {
  const [user, setUser] = useState(initialUser);
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    setUser(initialUser);
    setItems(initialItems);
  }, [initialUser, initialItems]);
  
  if (!user) {
    notFound();
  }

  const allottedItems: AllottedItem[] = [];
  items.forEach(item => {
    item.subItems.forEach(subItem => {
      if (subItem.assignedTo?.personId === user.personId) {
        allottedItems.push({
          itemName: item.name,
          itemId: item.id,
          subItemId: subItem.id,
          assignmentDate: subItem.assignedTo.assignmentDate,
          project: subItem.assignedTo.project,
        });
      }
    });
  });

  const handleUpdateUser = async (updatedUserData: User) => {
    await updateUser(updatedUserData);
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">User Details</h1>
          <p className="text-muted-foreground">Information for {user.name}</p>
        </div>
        <EditUserDialog user={user} onUpdate={handleUpdateUser} />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Person ID</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{user.personId}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Name</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{user.name}</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Phone Number</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{user.phone}</CardDescription>
          </CardHeader>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Department</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building className="h-6 w-6" /> {user.department || 'N/A'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
      
       <div className="grid md:grid-cols-1 gap-6 mb-8">
         <Card>
          <CardHeader>
            <CardTitle className="text-base font-normal text-muted-foreground">Joining Date</CardTitle>
            <CardDescription className="text-2xl font-bold text-foreground">{format(parseISO(user.joiningDate), 'PPP')}</CardDescription>
          </CardHeader>
        </Card>
      </div>


      <Card>
        <CardHeader>
          <CardTitle>Allotted Items</CardTitle>
          <CardDescription>A list of all inventory items currently assigned to this user.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Unit ID</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Assigned On</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allottedItems.map(item => (
                <TableRow key={item.subItemId}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell className="font-mono text-xs">{item.subItemId}</TableCell>
                  <TableCell>{item.project || 'N/A'}</TableCell>
                  <TableCell>{format(parseISO(item.assignmentDate), 'PPP')}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/item/${item.itemId}`} passHref>
                      <Button variant="outline" size="sm">View Item</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
               {allottedItems.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                        No items have been allotted to this user.
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
