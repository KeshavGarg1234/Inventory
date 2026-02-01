"use client";

import { useState, useEffect } from "react";
import type { BudgetList, Note, Tax } from "@/types";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BudgetListView } from "@/components/budget-list-view";
import { NotesView } from "@/components/notes-view";
import { ListChecks, StickyNote } from "lucide-react";

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean);
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}

type ListsViewProps = {
    initialBudgetLists: BudgetList[];
    initialNotes: Note[];
    initialTaxes: Tax[];
}

export function ListsView({ initialBudgetLists, initialNotes, initialTaxes }: ListsViewProps) {
  const [budgetLists, setBudgetLists] = useState(initialBudgetLists);
  const [notes, setNotes] = useState(initialNotes);
  const [taxes, setTaxes] = useState(initialTaxes);

  useEffect(() => {
    const dbRef = ref(db);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            setBudgetLists(firebaseObjectToArray<BudgetList>(data.budgetLists) || []);
            setNotes(firebaseObjectToArray<Note>(data.notes) || []);
            setTaxes(firebaseObjectToArray<Tax>(data.taxes) || []);
        } else {
            setBudgetLists([]);
            setNotes([]);
            setTaxes([]);
        }
    }, (error) => {
        console.error("Error fetching real-time data:", error);
    });

    return () => unsubscribe();
  }, []);


  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-headline">Lists & Tools</h1>
        <p className="text-muted-foreground">
            Create budget lists and manage notes.
        </p>
      </div>

       <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="budget"><ListChecks className="mr-2 h-4 w-4"/> Budget Lists</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="mr-2 h-4 w-4"/> Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="budget" className="mt-6">
            <BudgetListView initialBudgetLists={budgetLists} initialTaxes={taxes} />
        </TabsContent>
        <TabsContent value="notes" className="mt-6">
            <NotesView initialNotes={notes} />
        </TabsContent>
      </Tabs>
    </>
  );
}
