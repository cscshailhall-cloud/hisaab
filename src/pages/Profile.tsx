import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, Mail, KeyRound, Save, LogOut, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.full_name || user?.user_metadata?.full_name || "");
  const [username, setUsername] = useState(profile?.username || "");
  const [shopName, setShopName] = useState(profile?.shop_name || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [website, setWebsite] = useState(profile?.website || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.full_name || "");
      setUsername(profile.username || "");
      setShopName(profile.shop_name || "");
      setAddress(profile.address || "");
      setWebsite(profile.website || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) return toast.error("Name cannot be empty");
    if (!user) return;
    
    setIsLoading(true);
    try {
      // 1. Update Supabase Auth Metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
      if (authError) throw authError;

      // 2. Update Profiles Table in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: displayName,
          username: username,
          shop_name: shopName,
          address: address,
          website: website,
          email: user.email,
          updated_at: new Date().toISOString()
        });
      
      if (profileError) throw profileError;
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error("Failed to update profile", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return toast.error("Please enter a new password");
    if (newPassword !== confirmPassword) return toast.error("Passwords do not match");
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Failed to change password", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error("Logout failed");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500">Manage your profile and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-4">
          <Card className="border-none shadow-sm">
            <CardContent className="pt-6 text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600 mb-4 overflow-hidden">
                {profile?.avatar_url || user?.user_metadata?.avatar_url ? (
                  <img src={profile?.avatar_url || user?.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">{profile?.full_name || user?.user_metadata?.full_name || "User"}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <Button 
                  variant="outline" 
                  className="w-full text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your account's display name and shop details.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Full Name</Label>
                    <Input 
                      id="display-name" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      placeholder="johndoe"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shop-name">Shop Name</Label>
                    <Input 
                      id="shop-name" 
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-address">Shop Address</Label>
                    <Input 
                      id="profile-address" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    placeholder="https://example.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-readonly">Email Address</Label>
                  <Input 
                    id="email-readonly" 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-gray-50 h-11"
                  />
                  <p className="text-[10px] text-gray-400 italic">Email cannot be changed via profile update.</p>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Security</CardTitle>
              <CardDescription>Change your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input 
                    id="new-password" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input 
                    id="confirm-password" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700 h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <KeyRound className="w-4 h-4 mr-2" />}
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
