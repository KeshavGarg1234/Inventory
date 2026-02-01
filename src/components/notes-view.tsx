"use client";

import { useState, useEffect } from "react";
import type { Note } from "@/types";
import { saveNote, deleteNote } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase/config";
import { ref, onValue } from "firebase/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { DeleteConfirmationDialog } from "@/components/delete-confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

// Helper to convert Firebase object-with-numeric-keys to an array
function firebaseObjectToArray<T>(obj: any): T[] {
    if (!obj) return [];
    if (Array.isArray(obj)) return obj.filter(Boolean);
    if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj);
    }
    return [];
}

// Add/Edit Note Dialog
function AddEditNoteDialog({ note, onSave, trigger }: { note?: Note, onSave: (data: Omit<Note, 'id'|'createdAt'|'updatedAt'>) => Promise<any>, trigger: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(note?.title || "");
    const [content, setContent] = useState(note?.content || "");
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            setTitle(note?.title || "");
            setContent(note?.content || "");
        }
    }, [open, note]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await onSave({ title, content });
        if (result.success) {
            toast({ title: "Success", description: `Note has been ${note ? 'updated' : 'saved'}.` });
            if (!note) { setTitle(""); setContent(""); }
            setOpen(false);
        } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{note ? "Edit" : "Create"} Note</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="note-title">Title</Label>
                            <Input id="note-title" value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="note-content">Content</Label>
                            <Textarea id="note-content" value={content} onChange={e => setContent(e.target.value)} required rows={10} />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                        <Button type="submit">Save Note</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export function NotesView({ initialNotes }: { initialNotes: Note[] }) {
    const [notes, setNotes] = useState(initialNotes || []);
    const { toast } = useToast();

    useEffect(() => {
        const notesRef = ref(db, 'notes');
        const unsubscribe = onValue(notesRef, (snapshot) => {
            const serverNotes = firebaseObjectToArray<Note>(snapshot.val() || []);
            serverNotes.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            setNotes(serverNotes);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveNote = (data: Omit<Note, 'id'|'createdAt'|'updatedAt'>, id?: string) => saveNote(data, id);
    const handleDeleteNote = (id: string) => deleteNote(id);

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Notes</CardTitle>
                    <CardDescription>A place for your thoughts and reminders.</CardDescription>
                </div>
                <AddEditNoteDialog onSave={(data) => handleSaveNote(data)} trigger={<Button><PlusCircle className="mr-2 h-4 w-4"/>New Note</Button>} />
            </CardHeader>
            <CardContent>
                {notes.length === 0 ? (
                     <div className="text-center py-10 text-muted-foreground">No notes created yet.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map(note => (
                            <Card key={note.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle>{note.title}</CardTitle>
                                    <CardDescription>
                                        Updated {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-sm line-clamp-4">{note.content}</p>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                     <AddEditNoteDialog note={note} onSave={(data) => handleSaveNote(data, note.id)} trigger={<Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Edit</Button>} />
                                     <DeleteConfirmationDialog title="Delete Note?" description="Are you sure you want to delete this note?" onDelete={() => handleDeleteNote(note.id)} trigger={<Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4"/>Delete</Button>} />
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
