import { useState, useEffect, useMemo } from "react";
import { 
  BarChart3, 
  Download, 
  Calendar as CalendarIcon,
  FileText,
  TrendingUp,
  TrendingDown,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { supabase } from "@/lib/supabase";

export default function Reports() {
  const [timeRange, setTimeRange] = useState("last_6_months");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: invData } = await supabase.from("invoices").select("*");
      const { data: expData } = await supabase.from("expenses").select("*");
      if (invData) setInvoices(invData);
      if (expData) setExpenses(expData);
    };
    fetchData();
  }, []);

  const revenueData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(now.getMonth() - i);
      return { 
        month: months[d.getMonth()], 
        revenue: 0, 
        expenses: 0,
        monthIndex: d.getMonth(),
        year: d.getFullYear()
      };
    }).reverse();

    invoices.forEach(inv => {
      const d = new Date(inv.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      const entry = last6Months.find(e => e.monthIndex === m && e.year === y);
      if (entry && inv.status === 'Paid') {
        entry.revenue += inv.amount;
      }
    });

    expenses.forEach(exp => {
      const d = new Date(exp.date);
      const m = d.getMonth();
      const y = d.getFullYear();
      const entry = last6Months.find(e => e.monthIndex === m && e.year === y);
      if (entry) {
        entry.expenses += exp.amount;
      }
    });

    return last6Months;
  }, [invoices, expenses]);

  const serviceData = useMemo(() => {
    const categories: Record<string, { name: string, value: number, color: string }> = {
      "Government": { name: "Government", value: 0, color: "#2563eb" },
      "Utility": { name: "Utility", value: 0, color: "#10b981" },
      "Banking": { name: "Banking", value: 0, color: "#f59e0b" },
      "Insurance": { name: "Insurance", value: 0, color: "#ef4444" },
      "Other": { name: "Other", value: 0, color: "#8b5cf6" },
    };

    let total = 0;
    invoices.forEach(inv => {
      try {
        const items = JSON.parse(inv.items || "[]");
        items.forEach((item: any) => {
          // Note: In local state we don't have category on item usually, 
          // but we might have it from services table joined.
          // For now we'll categorize based on name or leave as Other if unknown
          // Ideally we join services or store category on invoice item.
          // Fallback to "Other"
          categories["Other"].value += item.price * item.quantity;
          total += item.price * item.quantity;
        });
      } catch (e) {
        // Fallback for simple invoices
        if (inv.status === 'Paid') {
           categories["Other"].value += inv.amount;
           total += inv.amount;
        }
      }
    });

    if (total === 0) return Object.values(categories);

    return Object.values(categories).map(c => ({
      ...c,
      value: Math.round((c.value / total) * 100)
    })).filter(c => c.value > 0);
  }, [invoices]);

  const stats = useMemo(() => {
    let rawRevenue = 0;
    let cash = 0, upi = 0, card = 0, pending = 0;
    let totalProfit = 0;

    invoices.forEach(inv => {
      const invTotal = inv.total_amount ?? inv.amount ?? 0;
      
      if (inv.status === 'Paid') {
        rawRevenue += invTotal;
        if (inv.payment_method === 'cash') cash += invTotal;
        else if (inv.payment_method === 'upi') upi += invTotal;
        else if (inv.payment_method === 'card') card += invTotal;
        else cash += invTotal; // fallback for old data without explicit method
      } else {
        pending += invTotal;
      }

      try {
        const items = typeof inv.items === 'string' ? JSON.parse(inv.items || "[]") : (inv.items || []);
        let costSum = 0;
        items.forEach((item: any) => {
          costSum += (item.cost || 0) * (item.quantity || 1);
        });
        if (inv.status === 'Paid') {
          totalProfit += (invTotal - costSum);
        }
      } catch (e) {}
    });

    const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const netProfit = totalProfit - totalExpenses;
    
    return {
      revenue: rawRevenue,
      netProfit,
      grossProfit: totalProfit,
      expenses: totalExpenses,
      breakdown: { cash, upi, card, pending }
    };
  }, [invoices, expenses]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Analyze your business performance and growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Revenue vs Expenses</CardTitle>
            <CardDescription>Comparison of monthly income and spending.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={30} />
                  <Bar dataKey="expenses" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Service Distribution</CardTitle>
            <CardDescription>Revenue share by category.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={serviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {serviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3 mt-4">
              {serviceData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm text-gray-600 font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { title: "Total Sales", value: `₹${stats.revenue.toLocaleString()}`, color: "text-blue-600" },
          { title: "Gross Profit", value: `₹${stats.grossProfit.toLocaleString()}`, color: "text-green-600" },
          { title: "Net Profit", value: `₹${stats.netProfit.toLocaleString()}`, color: stats.netProfit >= 0 ? "text-green-600" : "text-red-600" },
          { title: "Total Expenses", value: `₹${stats.expenses.toLocaleString()}`, color: "text-red-500" },
          { title: "Pending Dues", value: `₹${stats.breakdown.pending.toLocaleString()}`, color: "text-orange-500" }
        ].map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <p className="text-xs sm:text-sm text-gray-500 font-medium">{stat.title}</p>
              <h3 className={`text-xl sm:text-2xl font-black mt-2 ${stat.color}`}>{stat.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Payment Collection Breakdown</CardTitle>
          <CardDescription>Sales segmented by payment mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-gray-100 bg-emerald-50/50">
              <p className="text-sm font-bold text-emerald-700">Cash Received</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">₹{stats.breakdown.cash.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-purple-50/50">
              <p className="text-sm font-bold text-purple-700">UPI / QR</p>
              <p className="text-2xl font-black text-purple-600 mt-1">₹{stats.breakdown.upi.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-blue-50/50">
              <p className="text-sm font-bold text-blue-700">Card Terminal</p>
              <p className="text-2xl font-black text-blue-600 mt-1">₹{stats.breakdown.card.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-gray-100 bg-orange-50/50">
              <p className="text-sm font-bold text-orange-700">Pending</p>
              <p className="text-2xl font-black text-orange-600 mt-1">₹{stats.breakdown.pending.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Available Reports</CardTitle>
          <CardDescription>Download detailed reports in CSV or PDF format.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              "Daily Sales Report",
              "GST Summary Report",
              "Staff Performance Audit",
              "Inventory Stock Report",
              "Expense Category Analysis",
              "Customer Loyalty Report"
            ].map((report) => (
              <div key={report} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-medium text-gray-900">{report}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
