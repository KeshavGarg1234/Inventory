
"use client";

import { useState, useMemo } from "react";
import type { Item, NewItemData, ActionResponse } from "@/types";
import { AddItemDialog } from "@/components/add-item-dialog";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Search } from "lucide-react";
import { addItem } from "@/app/actions";
import { Button } from "@/components/ui/button";

export function InventoryView({ items: initialItems }: { items: Item[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState(initialItems);

  useMemo(() => {
    setItems(initialItems);
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return items;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return items.filter((item) => {
      const statusMatch = item.subItems.some((subItem) =>
        subItem.availabilityStatus.toLowerCase().includes(lowercasedTerm)
      );
      return (
        item.name.toLowerCase().includes(lowercasedTerm) ||
        item.id.toLowerCase().includes(lowercasedTerm) ||
        statusMatch
      );
    });
  }, [items, searchTerm]);
  
  const getImageDataAiHint = (itemName: string) => {
    return itemName.split(" ").slice(0, 2).join(" ").toLowerCase();
  };

  const handleAddItem = async (item: NewItemData): Promise<ActionResponse | void> => {
    return await addItem(item);
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Inventory Items</h1>
          <p className="text-muted-foreground">
            A complete list of all items in your inventory.
          </p>
        </div>
        <AddItemDialog onAddItem={handleAddItem} />
      </div>

      <Card className="mb-8 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Inventory Search</CardTitle>
          <CardDescription>
            Use the universal search below to find anything in your inventory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </CardContent>
      </Card>
      
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => {
            const availableCount = item.subItems.filter(
              (si) => si.availabilityStatus === "Available"
            ).length;
            return (
              <Card key={item.id} className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group bg-card">
                <CardHeader>
                  <div className="overflow-hidden rounded-md mb-4">
                    <img
                      src={item.imageUrl || 'https://placehold.co/400x300.png'}
                      alt={item.name}
                      className="w-full h-40 object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={getImageDataAiHint(item.name)}
                    />
                  </div>
                  <CardTitle>{item.name}</CardTitle>
                  <CardDescription className="line-clamp-2 h-10">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      <span className="font-bold text-foreground">{item.totalQuantity}</span> total units
                    </p>
                    <p>
                      <span className="font-bold text-green-500">{availableCount}</span> available
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button asChild className="w-full">
                    <Link href={`/item/${item.id}`}>View Details</Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <h3 className="text-xl font-semibold">No Items Found</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? 'Try adjusting your search term.' : 'Click "Add New Item" to get started.'}
          </p>
        </div>
      )}
    </div>
  );
}
