
"use client";

import { useState, useEffect } from "react";
import { notFound, usePathname, useRouter } from "next/navigation";
import { getData } from '@/app/actions';
import { PageContent } from "./page-content";
import type { Item } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

function ItemDetailSkeleton() {
    return (
        <div className="container mx-auto p-4 md:p-8">
            <Skeleton className="h-12 w-3/4 mb-4" />
            <Skeleton className="h-6 w-1/2 mb-8" />
            <Skeleton className="w-full h-[400px] rounded-lg mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
            </div>
            <Skeleton className="w-full h-96" />
        </div>
    )
}

export default function ItemDetailPage() {
    const router = useRouter();
    const pathname = usePathname();
    const id = pathname.split('/').pop();
    const [item, setItem] = useState<Item | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        
        async function fetchData() {
            try {
                setLoading(true);
                const { items } = await getData();
                const foundItem = items.find((i) => i.id === id);
                if (foundItem) {
                    setItem(foundItem);
                } else {
                    notFound();
                }
            } catch (err: any) {
                console.error("Failed to fetch item:", err);
                setError("Could not load item details. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [id]);

    if (loading) {
        return <ItemDetailSkeleton />;
    }
    
    if (error) {
        // You can render a more sophisticated error component here
        return <div className="container mx-auto p-8 text-center text-red-500">{error}</div>;
    }
    
    if (!item) {
        // This will be caught by notFound() in useEffect, but as a safeguard:
        return notFound();
    }
    
    return <PageContent itemData={item} />;
}
