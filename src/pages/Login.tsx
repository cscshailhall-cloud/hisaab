import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ShieldCheck } from "lucide-react";
import { signInWithGoogle } from "@/lib/firebase";
import { toast } from "sonner";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Logged in successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Login failed", {
        description: error.message
      });
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
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="admin@csc.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold">
              Sign In
            </Button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-100"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-400 font-medium">Or continue with</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full h-11 font-medium"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4 mr-2" alt="Google" />
              {isLoading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-400">
          &copy; 2024 CSC Digital Center. All rights reserved.
        </p>
      </div>
    </div>
  );
}
