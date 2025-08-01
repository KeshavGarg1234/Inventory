
import { getData } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { InventoryView } from "@/app/inventory-view";

export default async function InventoryPage() {
  try {
    const { items } = await getData();
    return <InventoryView items={items} />;
  } catch (error: any) {
    console.error(error);
    const errorMessage = error.message || "An unknown error occurred.";
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Failed to Load Inventory</AlertTitle>
          <AlertDescription>
            <p>There was a problem connecting to the database. This might be a temporary issue with Firestore.</p>
            <p className="font-mono text-xs mt-2">{errorMessage}</p>
            <p className="mt-4">Please ensure your Firebase project is set up correctly. You can find a direct link to your project in the README.md file.</p>
            <Button asChild className="mt-4">
              <Link href="/">Try Again</Link>
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }
}
