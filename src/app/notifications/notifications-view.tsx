
"use client";

import React, { useMemo, useEffect, useState } from "react";
import type {Notification, NotificationStatus, NotificationType} from "@/types";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {format, formatDistanceToNow, isAfter, isBefore, parseISO, subYears} from "date-fns";
import {Button} from "@/components/ui/button";
import {Badge} from "@/components/ui/badge";
import {handleNotificationAction, deleteNotificationsByDateRange} from "@/app/actions";
import {useToast} from "@/hooks/use-toast";
import {Bell, Check, HandPlatter, Trash2, Undo2, UserPlus, UserX, X, CalendarIcon as CalendarDateIcon, FilterX, FileDown } from "lucide-react";
import {db} from "@/lib/firebase/config";
import {onValue, ref} from "firebase/database";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

type NotificationsViewProps = {
  initialNotifications: Notification[];
};

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean); // Filter out null/empty slots
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj);
    }
    return [];
}


const notificationIcons: Partial<Record<Notification['type'], React.ElementType>> = {
    allot: HandPlatter,
    unallot: UserX,
    discard: Trash2,
    restore: Undo2,
    register: UserPlus,
}

const statusVariant: Record<NotificationStatus, "default" | "secondary" | "destructive"> = {
    pending: 'secondary',
    approve: 'default',
    rejected: 'destructive'
}

const NotificationDetails = ({ notification }: { notification: Notification }) => {
    const { requestedData } = notification;
    const requester = requestedData?.requester;

    const RequesterInfo = () => requester ? (
        <p className="mt-2 pt-2 border-t"><strong>By:</strong> {requester.name} ({requester.personId})</p>
    ) : null;

    if (notification.type === 'register' && requestedData?.newUser) {
        const details = requestedData.newUser;
        return (
            <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Name:</strong> {details.name}</p>
                <p><strong>Email:</strong> {details.email}</p>
                <p><strong>ID:</strong> {details.personId}</p>
                <p><strong>Phone:</strong> {details.phone}</p>
            </div>
        )
    }
    if ((notification.type === 'allot' || notification.type === 'unallot') && requestedData?.assignmentDetails) {
        const details = requestedData.assignmentDetails;
        const title = notification.type === 'allot' ? 'To:' : 'From:';
        return (
            <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>{title}</strong> {details.name} ({details.personId})</p>
                <p><strong>Phone:</strong> {details.phone}</p>
                {details.department && <p><strong>Dept:</strong> {details.department}</p>}
                {details.section && <p><strong>Section:</strong> {details.section}</p>}
                {details.project && <p><strong>Project:</strong> {details.project}</p>}
                <RequesterInfo />
            </div>
        )
    }
    
    // For discard, restore
    if (requester) {
         return (
            <div className="text-xs text-muted-foreground space-y-1">
               <RequesterInfo />
            </div>
        )
    }

    return null;
}

export function NotificationsView({ initialNotifications }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const { toast } = useToast();
  
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approve" | "rejected">("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({ from: undefined, to: undefined });

  // New state for picker month control
  const [fromPickerDate, setFromPickerDate] = useState<Date | undefined>(dateRange.from || undefined);
  const [toPickerDate, setToPickerDate] = useState<Date | undefined>(dateRange.to || undefined);

  useEffect(() => {
    // If the main dateRange.from changes (e.g. is cleared), update picker
    if (dateRange.from !== fromPickerDate) {
        setFromPickerDate(dateRange.from);
    }
  }, [dateRange.from]);

  useEffect(() => {
    if (dateRange.to !== toPickerDate) {
        setToPickerDate(dateRange.to);
    }
  }, [dateRange.to]);

  const handleYearChange = (yearValue: string, picker: 'from' | 'to') => {
    const year = parseInt(yearValue);
    if (!isNaN(year) && year > 1000 && year < 3000) {
        if (picker === 'from') {
            const newDate = fromPickerDate ? new Date(fromPickerDate) : new Date();
            newDate.setFullYear(year);
            setFromPickerDate(newDate);
        } else {
            const newDate = toPickerDate ? new Date(toPickerDate) : new Date();
            newDate.setFullYear(year);
            setToPickerDate(newDate);
        }
    }
  };

  useEffect(() => {
    const notifsRef = ref(db, `notifications`);
    
    const unsubscribe = onValue(notifsRef, (snapshot) => {
        if (snapshot.exists()) {
            const notifsData = firebaseObjectToArray<Notification>(snapshot.val());
            setNotifications(notifsData);
        } else {
            setNotifications([]);
        }
    }, (error) => {
        console.error("Error fetching real-time notifications:", error);
    });

    return () => {
        unsubscribe();
    };
  }, []);

  const handleAction = async (notificationId: string, action: 'approve' | 'reject') => {
    const result = await handleNotificationAction(notificationId, action);
    if (result.success) {
      toast({
        title: "Success",
        description: result.message
      });
      // The listener will update the state
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };
  
  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setDateRange({ from: undefined, to: undefined });
  };


  const filteredNotifications = useMemo(() => {
    return notifications
      .filter(n => {
        if (typeFilter !== 'all' && n.type !== typeFilter) return false;
        if (statusFilter !== 'all' && n.status !== statusFilter) return false;

        const notificationDate = parseISO(n.createdAt);
        if (dateRange.from && isBefore(notificationDate, dateRange.from)) return false;
        if (dateRange.to) {
            const toDate = new Date(dateRange.to);
            // set to end of day to make it inclusive
            toDate.setHours(23, 59, 59, 999);
            if (isAfter(notificationDate, toDate)) return false;
        }
        
        return true;
      })
      .sort((a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime());
  }, [notifications, typeFilter, statusFilter, dateRange]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Notifications Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    
    const filterSummary = `Filters: Type(${typeFilter}), Status(${statusFilter}), From(${dateRange.from ? format(dateRange.from, 'P') : 'N/A'}), To(${dateRange.to ? format(dateRange.to, 'P') : 'N/A'})`;
    doc.text(filterSummary, 14, 29);

    const tableData = filteredNotifications.map(notification => {
        let details = '';
        if (notification.type === 'register' && notification.requestedData?.newUser) {
            const d = notification.requestedData.newUser;
            details = `Name: ${d.name}, ID: ${d.personId}`;
        } else if ((notification.type === 'allot' || notification.type === 'unallot') && notification.requestedData?.assignmentDetails) {
            const d = notification.requestedData.assignmentDetails;
            const prefix = notification.type === 'allot' ? 'To:' : 'From:';
            details = `${prefix} ${d.name} (${d.personId})`;
        } else if (notification.requestedData?.requester) {
            details = `By: ${notification.requestedData.requester.name}`;
        }
        
        return [
            notification.type,
            notification.itemName || 'N/A',
            notification.subItemId || 'N/A',
            details,
            format(parseISO(notification.createdAt), "P p"),
            notification.status,
        ];
    });

    (doc as any).autoTable({
        head: [['Type', 'Target', 'Unit ID', 'Details', 'Date', 'Status']],
        body: tableData,
        startY: 35,
        headStyles: { fillColor: [41, 128, 185] },
        styles: { cellPadding: 3, fontSize: 8 },
    });

    doc.save(`notifications_report_${Date.now()}.pdf`);
  };

  const handleDeleteByDate = async () => {
    if (!dateRange.from || !dateRange.to) {
        toast({
            title: "Date Range Required",
            description: "Please select both a 'From' and 'To' date to delete notifications.",
            variant: "destructive",
        });
        return;
    }

    const result = await deleteNotificationsByDateRange(dateRange.from.toISOString(), dateRange.to.toISOString());

    if (result.success) {
        toast({
            title: "Success",
            description: result.message,
        });
    } else {
        toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
        });
    }
  };


  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline">Notifications</h1>
          <p className="text-muted-foreground">Approve, reject, and review requests.</p>
        </div>
      </div>
      
      <Card className="mb-8">
          <CardHeader>
              <CardTitle>Filter Requests</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
                <Label>Type</Label>
                <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="register">Register</SelectItem>
                        <SelectItem value="allot">Allot</SelectItem>
                        <SelectItem value="unallot">Unallot</SelectItem>
                        <SelectItem value="discard">Discard</SelectItem>
                        <SelectItem value="restore">Restore</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approve">Approve</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <Label>From</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                        >
                            <CalendarDateIcon className="mr-2 h-4 w-4" />
                            {dateRange.from ? format(dateRange.from, "PPP") : <span>Pick a start date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <div className="p-2">
                            <Input
                                placeholder="Year"
                                type="number"
                                defaultValue={fromPickerDate?.getFullYear()}
                                onBlur={(e) => handleYearChange(e.target.value, 'from')}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleYearChange((e.target as HTMLInputElement).value, 'from')}}
                                className="mb-2"
                            />
                        </div>
                        <Calendar
                            mode="single"
                            selected={dateRange.from}
                            onSelect={(d) => {
                                setDateRange(prev => ({...prev, from: d}));
                                if (d) setFromPickerDate(d);
                            }}
                            month={fromPickerDate}
                            onMonthChange={setFromPickerDate}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="space-y-2">
                <Label>To</Label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn("w-full justify-start text-left font-normal", !dateRange.to && "text-muted-foreground")}
                        >
                            <CalendarDateIcon className="mr-2 h-4 w-4" />
                            {dateRange.to ? format(dateRange.to, "PPP") : <span>Pick an end date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <div className="p-2">
                            <Input
                                placeholder="Year"
                                type="number"
                                defaultValue={toPickerDate?.getFullYear()}
                                onBlur={(e) => handleYearChange(e.target.value, 'to')}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleYearChange((e.target as HTMLInputElement).value, 'to')}}
                                className="mb-2"
                            />
                        </div>
                        <Calendar
                            mode="single"
                            selected={dateRange.to}
                            onSelect={(d) => {
                                setDateRange(prev => ({...prev, to: d}));
                                if (d) setToPickerDate(d);
                            }}
                            month={toPickerDate}
                            onMonthChange={setToPickerDate}
                            disabled={{ before: dateRange.from }}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
              <Button variant="ghost" onClick={clearFilters} disabled={typeFilter === 'all' && statusFilter === 'all' && !dateRange.from && !dateRange.to}>
                <FilterX className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportPDF} disabled={filteredNotifications.length === 0}>
                    <FileDown className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={!dateRange.from || !dateRange.to}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Filtered
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {`This will permanently delete all handled notifications (approved/rejected) within the selected date range (${dateRange.from ? format(dateRange.from, 'P') : '...'} to ${dateRange.to ? format(dateRange.to, 'P') : '...'}). Pending requests will not be affected. This action cannot be undone.`}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteByDate}>Confirm & Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
              </div>
          </CardFooter>
      </Card>

      <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>{`Showing ${filteredNotifications.length} of ${notifications.length} total requests.`}</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => {
                        const Icon = notificationIcons[notification.type] || Bell;
                        const statusLabel = notification.status.charAt(0).toUpperCase() + notification.status.slice(1);
                        return (
                        <TableRow key={notification.id}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <span className="capitalize font-medium">{notification.type.replace(/-/g, ' ')}</span>
                            </div>
                        </TableCell>
                        <TableCell>{notification.itemName || notification.requestedData?.newUser?.name}</TableCell>
                        <TableCell className="font-mono text-xs">{notification.subItemId || 'N/A'}</TableCell>
                        <TableCell>
                            <NotificationDetails notification={notification} />
                        </TableCell>
                        <TableCell>
                            <span title={format(parseISO(notification.createdAt), 'PPP p')}>
                                {formatDistanceToNow(parseISO(notification.createdAt), { addSuffix: true })}
                            </span>
                        </TableCell>
                         <TableCell>
                            <Badge variant={statusVariant[notification.status]}>{statusLabel}</Badge>
                         </TableCell>
                        <TableCell className="text-right">
                            {notification.status === 'pending' ? (
                            <div className="space-x-2">
                                <Button variant="outline" size="sm" onClick={() => handleAction(notification.id, 'reject')}>
                                    <X className="mr-2 h-4 w-4"/> Reject
                                </Button>
                                <Button size="sm" onClick={() => handleAction(notification.id, 'approve')}>
                                    <Check className="mr-2 h-4 w-4"/> Approve
                                </Button>
                            </div>
                            ) : (
                                <span className="text-xs text-muted-foreground">
                                    Handled {notification.handledAt ? formatDistanceToNow(parseISO(notification.handledAt), { addSuffix: true }) : ''}
                                </span>
                            )}
                        </TableCell>
                        </TableRow>
                        )
                    })
                    ) : (
                    <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                        No requests match your filters.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
            </Table>
          </CardContent>
      </Card>
    </>
  );
}
