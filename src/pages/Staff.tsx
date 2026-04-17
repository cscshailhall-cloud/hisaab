import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Shield, 
  User, 
  Mail, 
  Phone,
  MoreHorizontal,
  Activity,
  Calendar,
  Trash2
} from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  mobile: string;
  status: string;
  last_active?: string;
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: "",
    role: "Operator",
    email: "",
    mobile: "",
    status: "Active"
  });

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from("staff")
      .select("*")
      .order("name", { ascending: true });
    
    if (error) {
      console.error("Error fetching staff:", error);
    } else {
      setStaff(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStaff();

    const channel = supabase
      .channel('staff_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staff' }, fetchStaff)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.mobile) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("staff").insert({
        name: newStaff.name,
        role: newStaff.role,
        email: newStaff.email,
        mobile: newStaff.mobile,
        status: newStaff.status
      });

      if (error) throw error;

      toast.success("Staff member added successfully");
      setShowAddDialog(false);
      setNewStaff({ name: "", role: "Operator", email: "", mobile: "", status: "Active" });
    } catch (error: any) {
      toast.error("Failed to add staff", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Delete this staff member?")) return;
    try {
      const { error } = await supabase.from("staff").delete().eq("id", id);
      if (error) throw error;
      toast.success("Staff member removed");
    } catch (error: any) {
      toast.error("Failed to delete staff", { description: error.message });
    }
  };

  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'Active').length,
    attendance: staff.length > 0 ? Math.round((staff.filter(s => s.status === 'Active').length / staff.length) * 100) : 0
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">Manage team members, roles, and permissions.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <User className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Total Staff</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-xl text-green-600">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Active Now</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.active}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Attendance</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stats.attendance}%</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search staff..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Staff Member</TableHead>
                  <TableHead className="font-semibold">Role</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Last Active</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                            {staff.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{staff.name}</p>
                          <p className="text-xs text-gray-500">ID: STF-{staff.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">{staff.role}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Mail className="w-3 h-3" />
                          {staff.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {staff.mobile}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={staff.status === 'Active' ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}
                      >
                        {staff.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {staff.last_active || "Never"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteStaff(staff.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove Staff
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="st-name">Full Name</Label>
              <Input 
                id="st-name" 
                placeholder="Rahul Kumar" 
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="st-role">Role</Label>
              <Select value={newStaff.role} onValueChange={(val) => setNewStaff({...newStaff, role: val})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operator">Operator</SelectItem>
                  <SelectItem value="Accountant">Accountant</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="st-email">Email Address</Label>
              <Input 
                id="st-email" 
                type="email" 
                placeholder="rahul@csc.com" 
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="st-mobile">Mobile Number</Label>
              <Input 
                id="st-mobile" 
                placeholder="9876543210" 
                value={newStaff.mobile}
                onChange={(e) => setNewStaff({...newStaff, mobile: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600" onClick={handleAddStaff} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Staff"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
