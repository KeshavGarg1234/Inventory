"use client";

import { useState, useEffect, useMemo } from "react";
import type { Item, Bill, User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, PackageCheck, Package, PackageX, FileText, Users, Cog, Expand, Shrink } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { subWeeks, subMonths, subYears, isAfter, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from "@/lib/utils";

type DashboardViewProps = {
    items: Item[];
    bills: Bill[];
    users: User[];
}

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


export function DashboardView({ items: initialItems, bills: initialBills, users: initialUsers }: DashboardViewProps) {
    const [items, setItems] = useState(initialItems);
    const [bills, setBills] = useState(initialBills);
    const [users, setUsers] = useState(initialUsers);
    const [timePeriod, setTimePeriod] = useState<'1w' | '1m' | '3m' | '6m' | '1y'>('1m');
    const [isDistributionExpanded, setIsDistributionExpanded] = useState(false);

    useEffect(() => {
        const dbRef = ref(db);
        
        const unsubscribe = onValue(dbRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                setItems(firebaseObjectToArray<Item>(data.items));
                setBills(firebaseObjectToArray<Bill>(data.bills));
                setUsers(firebaseObjectToArray<User>(data.users));
            } else {
                setItems([]);
                setBills([]);
                setUsers([]);
            }
        }, (error) => {
            console.error("Error fetching real-time data:", error);
        });

        return () => unsubscribe();
    }, []);

    const availableCount = items.reduce((sum, item) => sum + (item.subItems || []).filter(si => si.availabilityStatus === 'Available').length, 0);
    const inUseCount = items.reduce((sum, item) => sum + (item.subItems || []).filter(si => si.availabilityStatus === 'In Use').length, 0);
    const discardedCount = items.reduce((sum, item) => sum + (item.subItems || []).filter(si => si.availabilityStatus === 'Discarded').length, 0);
    const totalUnits = availableCount + inUseCount + discardedCount;
    
    const chartData = items.map(item => ({
        name: item.name.length > 15 ? `${item.name.substring(0, 12)}...` : item.name,
        total: item.totalQuantity,
        Available: (item.subItems || []).filter(si => si.availabilityStatus === 'Available').length,
        "In Use": (item.subItems || []).filter(si => si.availabilityStatus === 'In Use').length,
        Discarded: (item.subItems || []).filter(si => si.availabilityStatus === 'Discarded').length,
    }));

    const usageData = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        switch (timePeriod) {
            case '1w':
                startDate = subWeeks(now, 1);
                break;
            case '1m':
                startDate = subMonths(now, 1);
                break;
            case '3m':
                startDate = subMonths(now, 3);
                break;
            case '6m':
                startDate = subMonths(now, 6);
                break;
            case '1y':
                startDate = subYears(now, 1);
                break;
        }

        // Redesigned logic for calculating item demand
        const relevantTransactions = items.flatMap(item =>
            (item.subItems || []).flatMap(subItem =>
                (subItem.transactionLog || []).map(log => ({ ...log, parentItem: item }))
            )
        );

        const filteredTransactions = relevantTransactions.filter(log => {
            // Check for both 'approve' (new) and 'allotted' (old) for backward compatibility.
            const isRelevantType = log.type === 'approve' || log.type === 'allotted';
            if (!isRelevantType) return false;
            
            try {
                const transactionDate = parseISO(log.date);
                return isAfter(transactionDate, startDate);
            } catch (e) {
                // Ignore logs with invalid dates
                return false;
            }
        });

        const demand = filteredTransactions.reduce((acc, log) => {
            const { parentItem } = log;
            if (!acc[parentItem.id]) {
                acc[parentItem.id] = { name: parentItem.name, count: 0 };
            }
            acc[parentItem.id].count++;
            return acc;
        }, {} as { [itemId: string]: { name: string, count: number } });

        return Object.values(demand).sort((a, b) => b.count - a.count);

    }, [items, timePeriod]);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
                    <p className="text-muted-foreground">Real-time inventory tracking and management system</p>
                </div>
                <SettingsDialog trigger={
                    <Button variant="outline">
                        <Cog className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                }/>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUnits}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available</CardTitle>
                        <PackageCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{availableCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Use</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{inUseCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Discarded</CardTitle>
                        <PackageX className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{discardedCount}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bills.length}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{users.length}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className={cn("transition-all duration-500 ease-in-out", isDistributionExpanded && "lg:col-span-2")}>
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle>Item Distribution</CardTitle>
                                <p className="text-sm text-muted-foreground">Availability status for each item type.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setIsDistributionExpanded(!isDistributionExpanded)}>
                                {isDistributionExpanded ? <Shrink className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
                                <span className="sr-only">{isDistributionExpanded ? 'Collapse' : 'Expand'}</span>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={isDistributionExpanded ? 500 : 350}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="name"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--background))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)'
                                    }}
                                />
                                <Legend wrapperStyle={{fontSize: '0.875rem', paddingTop: '1rem'}}/>
                                <Bar dataKey="Available" stackId="a" fill="hsl(var(--chart-2))" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="In Use" stackId="a" fill="hsl(var(--chart-4))" radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Discarded" stackId="a" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {!isDistributionExpanded && (
                    <Card className="animate-in fade-in duration-500">
                        <CardHeader>
                            <CardTitle>Item Demand</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Number of units assigned in the selected period.
                            </p>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as any)} className="w-full">
                                <TabsList className="grid w-full grid-cols-5">
                                    <TabsTrigger value="1w">1W</TabsTrigger>
                                    <TabsTrigger value="1m">1M</TabsTrigger>
                                    <TabsTrigger value="3m">3M</TabsTrigger>
                                    <TabsTrigger value="6m">6M</TabsTrigger>
                                    <TabsTrigger value="1y">1Y</TabsTrigger>
                                </TabsList>
                                <TabsContent value={timePeriod} className="mt-4">
                                    <div className="h-[350px] overflow-y-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Item Name</TableHead>
                                                    <TableHead className="text-right">Units Assigned</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {usageData.length > 0 ? (
                                                    usageData.map(item => (
                                                        <TableRow key={item.name}>
                                                            <TableCell className="font-medium">{item.name}</TableCell>
                                                            <TableCell className="text-right font-bold">{item.count}</TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={2} className="h-24 text-center">
                                                            No item usage in this period.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                )}
            </div>

        </div>
    );
}
