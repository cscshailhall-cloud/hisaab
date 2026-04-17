import { useState, useEffect, useMemo } from "react";
import { 
  TrendingUp, 
  Users, 
  Receipt, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface Invoice {
  id: string;
  amount: number;
  status: string;
  customer_name: string;
  date: string;
  created_at: string;
}

interface Customer {
  id: string;
  outstanding: number;
}

export default function Dashboard() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: invData } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
      const { data: custData } = await supabase.from("customers").select("id, outstanding");
      
      if (invData) setInvoices(invData as any[]);
      if (custData) setCustomers(custData as any[]);
      setLoading(false);
    };

    fetchData();

    const invChannel = supabase.channel('dashboard_invoices').on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, fetchData).subscribe();
    const custChannel = supabase.channel('dashboard_customers').on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchData).subscribe();

    return () => {
      supabase.removeChannel(invChannel);
      supabase.removeChannel(custChannel);
    };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = invoices.reduce((acc, curr) => acc + (curr.status === 'Paid' ? curr.amount : 0), 0);
    const pendingDues = customers.reduce((acc, curr) => acc + (curr.outstanding || 0), 0);
    const totalBills = invoices.length;
    const newCustomers = customers.length;

    return [
      { 
        title: "Total Revenue", 
        value: `₹${totalRevenue.toLocaleString()}`, 
        change: "+20.1%", 
        isPositive: true, 
        icon: Wallet,
        color: "text-blue-600",
        bg: "bg-blue-50"
      },
      { 
        title: "Total Bills", 
        value: totalBills.toString(), 
        change: "+12.5%", 
        isPositive: true, 
        icon: Receipt,
        color: "text-green-600",
        bg: "bg-green-50"
      },
      { 
        title: "Total Customers", 
        value: newCustomers.toString(), 
        change: "+4.3%", 
        isPositive: true, 
        icon: Users,
        color: "text-purple-600",
        bg: "bg-purple-50"
      },
      { 
        title: "Pending Dues", 
        value: `₹${pendingDues.toLocaleString()}`, 
        change: "+18.2%", 
        isPositive: false, 
        icon: Clock,
        color: "text-orange-600",
        bg: "bg-orange-50"
      },
    ];
  }, [invoices, customers]);

  const chartData = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { name: days[d.getDay()], revenue: 0, date: d.toDateString() };
    }).reverse();

    invoices.forEach(inv => {
      const invDate = new Date(inv.date).toDateString();
      const dayData = last7Days.find(d => d.date === invDate);
      if (dayData && inv.status === 'Paid') {
        dayData.revenue += inv.amount;
      }
    });

    return last7Days;
  }, [invoices]);

  const recentTransactions = useMemo(() => {
    return invoices.slice(0, 5);
  }, [invoices]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={stat.bg + " p-2 rounded-lg"}>
                  <stat.icon className={stat.color + " w-5 h-5"} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Revenue Growth</CardTitle>
              <CardDescription>Weekly revenue performance</CardDescription>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg">
              <MoreVertical className="w-5 h-5 text-gray-400" />
            </button>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#2563eb" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <CardDescription>Latest 5 bills generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">No transactions yet</div>
              ) : (
                recentTransactions.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                        {invoice.customer_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invoice.customer_name}</p>
                        <p className="text-xs text-gray-500">{new Date(invoice.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">₹{invoice.amount.toLocaleString()}</p>
                      <p className={cn(
                        "text-[10px] font-medium uppercase tracking-wider",
                        invoice.status === 'Paid' ? 'text-green-600' : 'text-orange-600'
                      )}>{invoice.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="w-full mt-6 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
              View All Transactions
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
