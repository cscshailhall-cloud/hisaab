import { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Wallet, 
  ArrowDownCircle, 
  Calendar as CalendarIcon,
  MoreHorizontal,
  FileText,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  staff: string;
  created_at: string;
}

const categories = ["Rent", "Electricity", "Staff Salary", "Internet", "Printer Ink", "Stationery", "Travel", "Marketing", "Maintenance", "Miscellaneous"];

export default function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    staff: "Admin"
  });

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("date", { ascending: false });
    
    if (error) {
      console.error("Error fetching expenses:", error);
    } else {
      setExpenses(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();

    const channel = supabase
      .channel('expenses_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, fetchExpenses)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddExpense = async () => {
    if (!newExpense.category || !newExpense.amount || !newExpense.date) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("expenses").insert({
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        date: newExpense.date,
        staff: newExpense.staff
      });

      if (error) throw error;

      toast.success("Expense recorded successfully");
      setShowAddDialog(false);
      setNewExpense({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        staff: "Admin"
      });
    } catch (error: any) {
      toast.error("Failed to record expense", { description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Delete this expense record?")) return;
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
      toast.success("Expense record deleted");
    } catch (error: any) {
      toast.error("Failed to delete record", { description: error.message });
    }
  };

  const filteredExpenses = expenses.filter(expense => 
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = useMemo(() => {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const thisMonth = expenses
      .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
      .reduce((acc, curr) => acc + curr.amount, 0);
    
    // Find top category
    const categoryTotals: Record<string, number> = {};
    expenses.forEach(e => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    return { total, thisMonth, topCategory };
  }, [expenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500">Track your daily income and business expenses.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <Button onClick={() => setShowAddDialog(true)} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" />
            Add New Expense
          </Button>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>
                Record a business expense.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select value={newExpense.category} onValueChange={(val) => setNewExpense({...newExpense, category: val})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  className="col-span-3" 
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input 
                  id="date" 
                  type="date" 
                  className="col-span-3" 
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">Description</Label>
                <Input 
                  id="desc" 
                  placeholder="e.g. Office rent" 
                  className="col-span-3" 
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddExpense} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                {isSubmitting ? "Saving..." : "Save Expense"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-100 rounded-lg text-red-600">
                <ArrowDownCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium uppercase tracking-wider">Total Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900">₹{stats.total.toLocaleString()}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Top Category</p>
                <h3 className="text-2xl font-bold text-gray-900">{stats.topCategory}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">This Month</p>
                <h3 className="text-2xl font-bold text-gray-900">₹{stats.thisMonth.toLocaleString()}</h3>
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
              placeholder="Search expenses..." 
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
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold">Amount</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Staff</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => (
                  <TableRow key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {expense.description}
                    </TableCell>
                    <TableCell className="font-bold text-red-600">
                      ₹{expense.amount}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {expense.date}
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {expense.staff}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteExpense(expense.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Record
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
    </div>
  );
}
