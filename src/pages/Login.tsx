import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, ShieldCheck, Phone, Mail, ArrowLeft, KeyRound, UserPlus } from "lucide-react";
import { 
  signInWithGoogle, 
  loginWithEmail, 
  registerWithEmail, 
  resetPassword,
  signInWithPhone,
  verifyOtp,
  setupRecaptcha
} from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

type AuthMode = "login" | "register" | "forgot" | "phone";

export default function Login() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    if (mode === "phone") {
      setupRecaptcha("recaptcha-container");
    }
  }, [mode]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success("Welcome!");
    } catch (error: any) {
      toast.error("Login failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill all fields");
    if (mode === "register" && (!fullName || !shopName || !mobile)) {
      return toast.error("Please fill all registration fields");
    }
    
    setIsLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
        toast.success("Welcome back!");
      } else {
        const userCredential = await registerWithEmail(email, password);
        const user = userCredential.user;

        // Immediately create the profile with detailed information
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.uid,
            full_name: fullName,
            shop_name: shopName,
            phone: mobile,
            address: address,
            email: email,
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // We don't throw here to avoid failing registration if profile creation fails
          // AuthContext will attempt to sync it anyway
        }

        toast.success("Account created successfully!");
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
      await resetPassword(email);
      toast.success("Password reset link sent to your email");
      setMode("login");
    } catch (error: any) {
      toast.error("Failed to send reset link", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return toast.error("Please enter phone number");
    
    setIsLoading(true);
    try {
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      await signInWithPhone(formattedPhone);
      setOtpSent(true);
      toast.success("OTP sent to your phone");
    } catch (error: any) {
      toast.error("Failed to send OTP", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter OTP");
    
    setIsLoading(true);
    try {
      await verifyOtp(otp);
      toast.success("Logged in successfully");
    } catch (error: any) {
      toast.error("Invalid OTP", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div id="recaptcha-container"></div>
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
                {mode === "phone" && "Phone Login"}
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
              {mode === "phone" && "Enter your mobile number to receive OTP."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "phone" ? (
              <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input 
                      id="phone" 
                      placeholder="+91 9876543210" 
                      className="pl-10"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={otpSent}
                    />
                  </div>
                </div>
                {otpSent && (
                  <div className="space-y-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input 
                      id="otp" 
                      placeholder="123456" 
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                    />
                  </div>
                )}
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold" disabled={isLoading}>
                  {isLoading ? "Processing..." : (otpSent ? "Verify OTP" : "Send OTP")}
                </Button>
              </form>
            ) : mode === "forgot" ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input 
                    id="reset-email" 
                    type="email" 
                    placeholder="admin@csc.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {mode === "register" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input 
                        id="fullName" 
                        placeholder="John Doe" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
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
                      />
                    </div>
                  </>
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
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 h-11 font-bold" disabled={isLoading}>
                  {isLoading ? "Please wait..." : (mode === "login" ? "Sign In" : "Create Account")}
                </Button>
              </form>
            )}

            {mode === "login" && (
              <div className="flex flex-col gap-3 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full h-11 font-medium"
                  onClick={() => setMode("phone")}
                >
                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                  Sign in with Phone
                </Button>
                
                <div className="relative py-2">
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
                  Sign in with Google
                </Button>

                <div className="text-center pt-4">
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
