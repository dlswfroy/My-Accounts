
"use client"

import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, LogIn, UserPlus, Chrome } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "লগইন ব্যর্থ হয়েছে",
        description: "ইমেইল বা পাসওয়ার্ড সঠিক নয়।"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "সাইন-আপ ব্যর্থ হয়েছে",
        description: error.message || "দয়া করে আবার চেষ্টা করুন।"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "গুগল লগইন ব্যর্থ",
        description: "গুগল দিয়ে লগইন করা সম্ভব হচ্ছে না।"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-2xl rounded-[2rem]">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary p-4 rounded-3xl text-primary-foreground shadow-lg">
              <Wallet className="w-10 h-10" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold font-headline tracking-tight text-primary">আমার হিসাব</CardTitle>
            <CardDescription className="text-muted-foreground mt-2">আপনার ব্যক্তিগত হিসাব ব্যবস্থাপক</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 p-1 rounded-2xl">
              <TabsTrigger value="login" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">লগইন</TabsTrigger>
              <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">সাইন-আপ</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">পাসওয়ার্ড</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold" disabled={isLoading}>
                  {isLoading ? "অপেক্ষা করুন..." : <><LogIn className="mr-2 h-5 w-5" /> প্রবেশ করুন</>}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleEmailSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">ইমেইল</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    placeholder="example@mail.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">পাসওয়ার্ড</Label>
                  <Input 
                    id="signup-password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-xl h-12"
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground" disabled={isLoading}>
                  {isLoading ? "অপেক্ষা করুন..." : <><UserPlus className="mr-2 h-5 w-5" /> একাউন্ট খুলুন</>}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-muted"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-4 text-muted-foreground">অথবা</span>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl border-2 hover:bg-muted/50" 
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <Chrome className="mr-2 h-5 w-5 text-red-500" />
            গুগল দিয়ে প্রবেশ করুন
          </Button>
        </CardContent>
        <CardFooter className="flex justify-center pb-8">
          <p className="text-xs text-muted-foreground">নিরাপদ হিসাব ব্যবস্থাপনার জন্য লগইন করুন</p>
        </CardFooter>
      </Card>
    </div>
  );
}
