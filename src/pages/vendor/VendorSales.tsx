import { useState } from "react";
import { TrendingUp, ShoppingBag, Users, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import { dashboardConfigs } from "@/config/dashboardConfig";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 2000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 1890 },
  { name: 'Sat', sales: 2390 },
  { name: 'Sun', sales: 3490 },
];

const VendorSales = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = dashboardConfigs.vendor.navItems.map((item) => ({
    ...item,
    active: item.label === "Revenue",
    onClick: () => {
      if (item.label === "Overview") navigate("/vendor/dashboard");
      else if (item.label === "Manage Menu") navigate("/vendor/menu");
      else if (item.label === "Orders") navigate("/vendor/orders");
    },
  }));

  return (
    <div className="min-h-screen bg-muted/30">
      <DashboardSidebar
        items={navItems}
        role="Vendor"
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <main className={`transition-all duration-300 ${collapsed ? "ml-20" : "ml-64"}`}>
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">Sales Analytics</h1>
              <p className="text-muted-foreground font-body text-sm mt-1">Track your performance and earnings</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Total Revenue</CardTitle>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">₦452,500</div>
                    <p className="text-[10px] text-green-500 font-medium mt-1">+12% from last month</p>
                </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Orders Count</CardTitle>
                    <ShoppingBag className="w-4 h-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">128</div>
                    <p className="text-[10px] text-primary font-medium mt-1">Across 4 categories</p>
                </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Customers</CardTitle>
                    <Users className="w-4 h-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">84</div>
                    <p className="text-[10px] text-blue-500 font-medium mt-1">24 new this week</p>
                </CardContent>
            </Card>
          </div>

          <Card className="bg-white border-none shadow-sm mb-8">
            <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Daily Sales (Last 7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(value) => `₦${value/1000}k`} />
                            <Tooltip
                                cursor={{fill: '#f8f8f8'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                formatter={(value) => [`₦${value.toLocaleString()}`, 'Sales']}
                            />
                            <Bar dataKey="sales" fill="#ea384c" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Top Selling Items</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { name: "Jollof Rice Special", sales: 45, revenue: "₦112,500" },
                            { name: "Beef Suya Scoop", sales: 32, revenue: "₦48,000" },
                            { name: "Egusi Soup & Pounded Yam", sales: 28, revenue: "₦84,000" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-[10px] font-bold">{i+1}</div>
                                    <span className="text-sm font-medium">{item.name}</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{item.revenue}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.sales} sold</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                    <CardTitle className="text-sm font-bold">Recent Payouts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[
                            { date: "Oct 12, 2023", amount: "₦84,200", status: "Processed" },
                            { date: "Oct 05, 2023", amount: "₦92,100", status: "Processed" },
                            { date: "Sep 28, 2023", amount: "₦76,400", status: "Processed" }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">{item.date}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.status}</p>
                                </div>
                                <span className="text-sm font-bold">{item.amount}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VendorSales;
