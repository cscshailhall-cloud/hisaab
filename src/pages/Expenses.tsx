import { useState } from "react";
import { 
  Plus, 
  Search, 
  Wallet, 
  ArrowDownCircle, 
  Calendar as CalendarIcon,
  MoreHorizontal,
  FileText
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
  DialogTrigger,
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

const mockExpenses = [
  { id: "1", category: "Rent", amount: 12000, description: "Office rent for March", date: "2024-03-01", staff: "Admin" },
  { id: "2", category: "Electricity", amount: 2450, description: "Electricity bill", date: "2024-03-05", staff: "Admin" },
  { id: "3", category: "Internet", amount: 999, description: "Fiber broadband", date: "2024-03-07", staff: "Operator" },
  { id: "4", category: "Stationery", amount: 450, description: "A4 paper rim", date: "2024-03-10", staff: "Operator" },
  { id: "5", category: "Marketing", amount: 1500, description: "Facebook ads", date: "2024-03-12", staff: "Admin" },
];

const categories = ["Rent", "Electricity", "Staff Salary", "Internet", "Printer Ink", "Stationery", "Travel", "Marketing", "Maintenance", "Miscellaneous"];

export default function Expenses() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredExpenses = mockExpenses.filter(expense => 
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpense = mockExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500">Track your daily income and business expenses.</p>
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="bg-red-600 hover:bg-red-700" />}>
            <Plus className="w-4 h-4 mr-2" />
            Add New Expense
          </DialogTrigger>
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
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="amount" className="text-right">Amount (₹)</Label>
                <Input id="amount" type="number" placeholder="0.00" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">Date</Label>
                <Input id="date" type="date" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="desc" className="text-right">Description</Label>
                <Input id="desc" placeholder="e.g. Office rent" className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Save Expense</Button>
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
                <h3 className="text-2xl font-bold text-gray-900">₹{totalExpense.toLocaleString()}</h3>
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
                <h3 className="text-2xl font-bold text-gray-900">Rent</h3>
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
                <h3 className="text-2xl font-bold text-gray-900">₹17,399</h3>
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
                          <DropdownMenuItem>
                            <FileText className="w-4 h-4 mr-2" />
                            View Receipt
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Plus className="w-4 h-4 mr-2" />
                            Edit Expense
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">Delete Record</DropdownMenuItem>
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
