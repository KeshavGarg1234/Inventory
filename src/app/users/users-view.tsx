
"use client";

import { useState, useMemo } from "react";
import type { User, Item } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type UsersPageProps = {
  users: User[];
  items: Item[];
};

export function UsersView({ users: initialUsers, items: initialItems }: UsersPageProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState(initialUsers);
  const [items, setItems] = useState(initialItems);

  useMemo(() => {
    setUsers(initialUsers);
    setItems(initialItems);
  }, [initialUsers, initialItems]);


  const getAllottedItemCount = (personId: string) => {
    return items.reduce((total, item) => {
      const count = item.subItems.filter(
        (si) => si.assignedTo?.personId === personId
      ).length;
      return total + count;
    }, 0);
  };

  const filteredUsers = useMemo(() => {
    if (!searchTerm) {
      return users;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(lowercasedTerm) ||
        user.phone.toLowerCase().includes(lowercasedTerm) ||
        user.personId.toLowerCase().includes(lowercasedTerm)
      );
    });
  }, [users, searchTerm]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Users</h1>
        <p className="text-muted-foreground">
          A list of all users with allotted inventory items.
        </p>
      </div>

      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">User Search</CardTitle>
          <CardDescription>
            Search by name, person ID, or phone number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Click on a user to view their details and allotted items.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items Allotted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <TableRow key={user.personId}>
                    <TableCell className="font-medium">{user.personId}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{getAllottedItemCount(user.personId)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/users/${user.personId}`} passHref>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center text-muted-foreground h-24"
                  >
                    {searchTerm
                      ? "No users match your search."
                      : "No users found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {`Showing ${filteredUsers.length} of ${users.length} user(s).`}
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
