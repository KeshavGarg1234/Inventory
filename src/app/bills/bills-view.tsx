
"use client";

import { useState, useMemo } from "react";
import type { Bill, Item } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type BillsPageProps = {
  bills: Bill[];
  items: Item[];
  initialSearch: string;
};

export function BillsView({ bills: initialBills, items: initialItems, initialSearch }: BillsPageProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [bills, setBills] = useState(initialBills);
  const [items, setItems] = useState(initialItems);

  useMemo(() => {
    setBills(initialBills);
    setItems(initialItems);
  }, [initialBills, initialItems]);

  const getItemCountForBill = (billNumber: string) => {
    return items.reduce((count, item) => {
      const itemCount = item.subItems.filter(
        (si) => si.billNumber === billNumber
      ).length;
      return count + itemCount;
    }, 0);
  };

  const getItemsForBill = (billNumber: string) => {
    return items.filter((item) =>
      item.subItems.some((si) => si.billNumber === billNumber)
    );
  };

  const filteredBills = useMemo(() => {
    if (!searchTerm) {
      return bills;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return bills.filter((bill) => {
      const billDateMatch = format(parseISO(bill.billDate), "PPP")
        .toLowerCase()
        .includes(lowercasedTerm);
      const itemsInBill = getItemsForBill(bill.billNumber);
      const itemMatch = itemsInBill.some((item) =>
        item.name.toLowerCase().includes(lowercasedTerm)
      );

      return (
        bill.billNumber.toLowerCase().includes(lowercasedTerm) ||
        bill.company.toLowerCase().includes(lowercasedTerm) ||
        billDateMatch ||
        itemMatch
      );
    });
  }, [bills, items, searchTerm]);

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Bills</h1>
        <p className="text-muted-foreground">
          A list of all purchase bills in the inventory.
        </p>
      </div>

      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Bill Search</CardTitle>
          <CardDescription>
            Search by bill number, company, date, or item name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search bills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Bills</CardTitle>
          <CardDescription>
            Click on a bill to view its details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Bill Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <TableRow key={bill.billNumber}>
                    <TableCell className="font-medium">
                      {bill.billNumber}
                    </TableCell>
                    <TableCell>{bill.company}</TableCell>
                    <TableCell>
                      {format(parseISO(bill.billDate), "PPP")}
                    </TableCell>
                    <TableCell>{getItemCountForBill(bill.billNumber)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/bills/${bill.billNumber}`} passHref>
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
                      ? "No bills match your search."
                      : "No bills found."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">
            {`Showing ${filteredBills.length} of ${bills.length} bill(s).`}
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
