import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ShieldCheck, Mail, ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type AuthMode = "login" | "register" | "forgot";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    if (mode === "register" && (!fullName || !shopName || !mobile)) {
      return toast.error("Please fill all registration fields");
    }
    
    setIsLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        toast.success("Welcome back!");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: mobile,
              shop_name: shopName
            }
          }
        });
        
        if (error) throw error;

        // If email confirmation is off, data.user will exist
        if (data.user) {
          // Trigger handled profile creation, but manual upsert ensures immediate consistency
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            phone: mobile,
            shop_name: shopName,
            address,
            updated_at: new Date().toISOString()
          });
          toast.success("Account created successfully!");
        } else {
          toast.success("Check your email for confirmation!");
        }
      }
    } catch (error: any) {
      toast.error("Authentication failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email");
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`
      });
      if (error) throw error;
      toast.success("Password reset link sent to your email");
      setMode("login");
    } catch (error: any) {
      toast.error("Failed to send reset link", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">CSC Billing</h1>
          <p className="text-gray-500 mt-2">Premium Service Management Software</p>
        </div>

        <Card className="border-none shadow-xl shadow-gray-200/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {mode === "login" && "Welcome Back"}
                {mode === "register" && "Create Account"}
                {mode === "forgot" && "Reset Password"}
              </CardTitle>
              {mode !== "login" && (
                <Button variant="ghost" size="sm" onClick={() => setMode("login")}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              )}
            </div>
            <CardDescription>
              {mode === "login" && "Sign in to your account to continue."}
              {mode === "register" && "Join us to manage your digital center."}
              {mode === "forgot" && "Enter your email to receive a reset link."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "forgot" ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input 
                      id="reset-email" 
                      type="email" 
                      placeholder="admin@csc.com" 
                      className="pl-10 h-11"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === "register" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        placeholder="John Doe" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shopName">Shop Name</Label>
                      <Input 
                        id="shopName" 
                        placeholder="My Digital Center" 
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input 
                        id="mobile" 
                        placeholder="9876543210" 
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Shop Address</Label>
                      <Input 
                        id="address" 
                        placeholder="123 Street, City" 
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                        className="h-11"
                      />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="admin@csc.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button 
                        type="button"
                        onClick={() => setMode("forgot")}
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : (mode === "login" ? "Sign In" : "Create Account")}
                </Button>
              </form>
            )}

            {mode === "login" && (
              <div className="pt-4 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setMode("register")}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Register Now
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          &copy; 2024 CSC Digital Center. All rights reserved.
        </p>
      </div>
    </div>
  );
}
