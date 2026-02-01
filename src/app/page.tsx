
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Archive, ArrowRight, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ThemeToggle } from '@/components/theme-toggle';

function ForgotPasswordDialog() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'Please check your inbox for instructions to reset your password.',
      });
      setOpen(false); // Close dialog on success
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not send reset email. Please ensure the email address is correct and registered.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
        >
          Forgot Password?
        </button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handlePasswordReset}>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Enter your email address and we will send you a link to reset your password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Success', description: 'Logged in successfully.' });
      router.push('/dashboard'); // Redirect to dashboard
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error signing in',
        description: 'Invalid email or password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen animated-gradient-background p-4 md:p-8 overflow-hidden">
       <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="relative z-10 w-full max-w-sm text-center">
         <div className="flex items-center justify-center gap-2 mb-4">
            <Archive className="h-10 w-10 text-primary" />
            <h1 className="text-5xl font-bold font-headline animate-text-shimmer bg-clip-text text-transparent">inventra</h1>
        </div>
        
        <form onSubmit={handleSignIn} className="space-y-4 bg-card/80 backdrop-blur-sm p-6 rounded-lg border shadow-sm mt-8">
            <div className="space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">Welcome Back</h2>
                <p className="text-sm text-muted-foreground">Enter your credentials to access your inventory</p>
            </div>
            <div className="space-y-2 text-left">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    disabled={isLoading}
                    required
                />
            </div>
             <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <ForgotPasswordDialog />
                </div>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                />
            </div>
            <Button size="lg" className="w-full" type="submit" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
             <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card/80 px-2 text-muted-foreground">
                  Or
                </span>
              </div>
            </div>
             <Button size="lg" variant="secondary" className="w-full" asChild>
                <Link href="/register">Register a new user</Link>
            </Button>
            <Button size="lg" variant="outline" className="w-full" asChild>
                <a href="mailto:support@example.com">
                    <Mail className="mr-2 h-4 w-4"/>
                    Contact Us
                </a>
            </Button>
        </form>
      </div>
    </div>
  );
}
