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

const data = [
  { name: "Mon", revenue: 4000, bills: 24 },
  { name: "Tue", revenue: 3000, bills: 18 },
  { name: "Wed", revenue: 2000, bills: 15 },
  { name: "Thu", revenue: 2780, bills: 20 },
  { name: "Fri", revenue: 1890, bills: 12 },
  { name: "Sat", revenue: 2390, bills: 16 },
  { name: "Sun", revenue: 3490, bills: 22 },
];

const stats = [
  { 
    title: "Total Revenue", 
    value: "₹45,231.89", 
    change: "+20.1%", 
    isPositive: true, 
    icon: Wallet,
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  { 
    title: "Total Bills", 
    value: "127", 
    change: "+12.5%", 
    isPositive: true, 
    icon: Receipt,
    color: "text-green-600",
    bg: "bg-green-50"
  },
  { 
    title: "New Customers", 
    value: "24", 
    change: "-4.3%", 
    isPositive: false, 
    icon: Users,
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  { 
    title: "Pending Dues", 
    value: "₹8,432.00", 
    change: "+18.2%", 
    isPositive: false, 
    icon: Clock,
    color: "text-orange-600",
    bg: "bg-orange-50"
  },
];

export default function Dashboard() {
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
                <AreaChart data={data}>
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
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                      JD
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">John Doe</p>
                      <p className="text-xs text-gray-500">PAN Card Service</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">₹250.00</p>
                    <p className="text-[10px] text-green-600 font-medium uppercase tracking-wider">Paid</p>
                  </div>
                </div>
              ))}
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
