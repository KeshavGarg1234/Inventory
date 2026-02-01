
"use client";

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SubItem, Transaction } from "@/types";
import { format, parseISO } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AllotmentHistoryDialogProps {
  subItem: SubItem;
  trigger: React.ReactNode;
}

export function AllotmentHistoryDialog({ subItem, trigger }: AllotmentHistoryDialogProps) {
  const allotmentHistory = useMemo(() => {
    const eventsMap = new Map<string, Transaction>();

    const addEvent = (event: Transaction) => {
        const key = `${event.type}-${event.date}-${event.assignment?.personId || ''}`;
        if (!eventsMap.has(key)) {
            eventsMap.set(key, event);
        }
    };

    // 1. Process new transactionLog
    (subItem.transactionLog || []).forEach(addEvent);

    // 2. Process old allotmentHistory for backward compatibility
    (subItem.allotmentHistory || []).forEach(pastAssignment => {
      addEvent({
        type: 'allotted',
        date: pastAssignment.assignmentDate,
        assignment: pastAssignment,
      });
      if (pastAssignment.unallotmentDate) {
        addEvent({
            type: 'unallotted',
            date: pastAssignment.unallotmentDate,
            assignment: pastAssignment,
        });
      }
    });

    // 3. Process the current assignment
    if (subItem.assignedTo) {
        addEvent({
            type: 'approve',
            date: subItem.assignedTo.assignmentDate,
            assignment: subItem.assignedTo
        });
    }

    const allEvents = Array.from(eventsMap.values());
    
    // Filter for only allotment-related events and sort
    return allEvents
      .filter(event => event.type === 'allotted' || event.type === 'unallotted' || event.type === 'approve')
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  }, [subItem]);

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Allotment History for Unit {subItem.id}</DialogTitle>
          <DialogDescription>
            A log of users this unit has been assigned to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {allotmentHistory.length > 0 ? (
            <ScrollArea className="h-80">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Project</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allotmentHistory.map((event, index) => {
                    const userName = event.assignment?.name || 'N/A';
                    const userPersonId = event.assignment?.personId;
                    const isAllottedEvent = event.type === 'allotted' || event.type === 'approve';
                    const actionType = isAllottedEvent ? 'Approved' : 'Unallotted';
                    
                    return (
                      <TableRow key={`${event.date}-${index}`}>
                        <TableCell>
                            <div className="font-medium">{userName}</div>
                            {userPersonId && <div className="text-xs text-muted-foreground">{userPersonId}</div>}
                        </TableCell>
                        <TableCell>
                            <Badge variant={isAllottedEvent ? 'default' : 'outline'}>{actionType}</Badge>
                        </TableCell>
                        <TableCell>{format(parseISO(event.date), 'PPP')}</TableCell>
                        <TableCell>{event.assignment?.project || 'N/A'}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-40">
                <p className="text-lg font-semibold">Item Not Allotted Yet</p>
                <p className="text-muted-foreground mt-1">This item has never been allotted to any user.</p>
            </div>
          )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Close</Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
