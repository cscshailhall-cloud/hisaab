import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Receipt, 
  Briefcase, 
  Wallet, 
  Package, 
  UserCog, 
  BarChart3, 
  Settings, 
  MessageSquare,
  LogOut,
  FileText
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { logout } from "@/lib/firebase";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Customers", path: "/customers" },
  { icon: Receipt, label: "Billing", path: "/billing" },
  { icon: FileText, label: "Invoices", path: "/invoices" },
  { icon: Briefcase, label: "Services", path: "/services" },
  { icon: Wallet, label: "Expenses", path: "/expenses" },
  { icon: Package, label: "Inventory", path: "/inventory" },
  { icon: UserCog, label: "Staff", path: "/staff" },
  { icon: BarChart3, label: "Reports", path: "/reports" },
  { icon: MessageSquare, label: "WhatsApp", path: "/whatsapp" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">CSC Billing</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
