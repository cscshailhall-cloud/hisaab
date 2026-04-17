import { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin,
  FileText,
  History,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Download,
  Trash2,
  Bell,
  ArrowLeft,
  Calendar,
  CreditCard,
  Banknote
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Customer {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  address?: string;
  outstanding: number;
  total_spent: number;
  bills_count: number;
  history?: any[];
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    email: "",
    address: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase Error:", error);
        toast.error("Failed to load customers");
      } else {
        setCustomers(data as any[]);
      }
    };

    fetchCustomers();

    const channel = supabase
      .channel('customers_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        fetchCustomers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId),
    [selectedCustomerId, customers]
  );

  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.mobile.includes(searchTerm)
  );

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.mobile) {
      toast.error("Name and Mobile are required");
      return;
    }
    setIsSubmitting(true);
    try {
      const customerData: any = {
        name: newCustomer.name,
        mobile: newCustomer.mobile,
        outstanding: 0,
        total_spent: 0,
        total_paid: 0,
        bills_count: 0,
      };

      if (newCustomer.email) customerData.email = newCustomer.email;
      if (newCustomer.address) customerData.address = newCustomer.address;

      const { error } = await supabase.from("customers").insert(customerData);
      if (error) throw error;
      
      toast.success("Customer added successfully");
      setShowAddDialog(false);
      setNewCustomer({ name: "", mobile: "", email: "", address: "" });
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error("Failed to add customer", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    try {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Customer deleted");
    } catch (error: any) {
      toast.error("Failed to delete customer", { description: error.message });
    }
  };

  if (selectedCustomerId && selectedCustomer) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedCustomerId(null)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h1>
            <p className="text-sm text-gray-500">Customer ID: #{selectedCustomer.id}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-blue-600 text-white">
            <CardContent className="p-4">
              <p className="text-xs text-blue-100 font-bold uppercase tracking-wider">Total Services</p>
              <h3 className="text-2xl font-bold mt-1">{selectedCustomer.bills_count}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Debit</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">₹{selectedCustomer.total_spent}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Credit</p>
              <h3 className="text-2xl font-bold mt-1 text-green-600">₹{selectedCustomer.total_paid || 0}</h3>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-red-50 border border-red-100">
            <CardContent className="p-4">
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Net Outstanding</p>
              <h3 className="text-2xl font-bold mt-1 text-red-700">₹{selectedCustomer.outstanding}</h3>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Transaction History</CardTitle>
                  <CardDescription>Ledger of all bills and payments.</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toast.success("Reminder sent via WhatsApp")}>
                    <Bell className="w-4 h-4 mr-2" />
                    Send Reminder
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-gray-100">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedCustomer.history?.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs">{item.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold",
                              item.type === 'Bill' ? "text-blue-600 border-blue-100 bg-blue-50" : "text-green-600 border-green-100 bg-green-50"
                            )}>
                              {item.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium">{item.description}</TableCell>
                          <TableCell className="font-bold">₹{item.amount}</TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "text-[10px]",
                              item.status === 'Paid' || item.status === 'Completed' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => toast.error("Transaction deleted")}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Mobile</p>
                    <p className="font-bold text-gray-900">{selectedCustomer.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Email</p>
                    <p className="font-bold text-gray-900">{selectedCustomer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Address</p>
                    <p className="font-bold text-gray-900">{selectedCustomer.address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gray-900 text-white">
              <CardContent className="p-6">
                <h4 className="font-bold mb-2">Quick Payment Link</h4>
                <p className="text-sm text-gray-400 mb-4">Generate a payment link for the outstanding balance of ₹{selectedCustomer.outstanding}.</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Generate Link
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Manage your customer database and history.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Customer
        </Button>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-0">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by name or mobile..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="w-full sm:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-md border border-gray-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Contact</TableHead>
                  <TableHead className="font-semibold">Ledger</TableHead>
                  <TableHead className="font-semibold">Bills</TableHead>
                  <TableHead className="font-semibold">Total Spent</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelectedCustomerId(customer.id)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{customer.name}</p>
                          <p className="text-xs text-gray-500">ID: #{customer.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Phone className="w-3 h-3" />
                          {customer.mobile}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">Outstanding</p>
                        <p className={cn(
                          "font-bold",
                          customer.outstanding > 0 ? "text-red-600" : "text-green-600"
                        )}>₹{customer.outstanding}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">
                        {customer.bills_count} Bills
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="font-bold text-gray-900">₹{customer.total_spent}</p>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger render={
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        } />
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setSelectedCustomerId(customer.id)}>
                            <FileText className="w-4 h-4 mr-2" />
                            View Ledger
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <History className="w-4 h-4 mr-2" />
                            Bill History
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Bill
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteCustomer(customer.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Customer
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
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>
              Enter the customer details below. Name and Mobile are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                placeholder="John Doe" 
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input 
                id="mobile" 
                placeholder="9876543210" 
                value={newCustomer.mobile}
                onChange={(e) => setNewCustomer({...newCustomer, mobile: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="john@example.com" 
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address (Optional)</Label>
              <Input 
                id="address" 
                placeholder="City, State" 
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600" onClick={handleAddCustomer} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
