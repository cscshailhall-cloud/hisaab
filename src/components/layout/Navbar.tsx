import { Bell, Search, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function Navbar() {
  const { user, profile } = useAuth();
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Admin User";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed", { description: error.message });
    } else {
      toast.success("Signed out successfully");
    }
  };

  return (
    <header className="h-16 bg-white border-bottom border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search customers, bills, services..." 
            className="pl-10 bg-gray-50 border-none focus-visible:ring-1 focus-visible:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 pl-2 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-right hidden sm:block">
              <span className="block text-sm font-medium text-gray-900">{displayName}</span>
              <span className="block text-xs text-gray-500">{user?.email}</span>
            </span>
            <Avatar className="w-9 h-9 border border-gray-200">
              <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url || ""} />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                {displayName?.split(' ').map((n: string) => n[0]).join('') || "AD"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Branch Details</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600" onClick={handleLogout}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
