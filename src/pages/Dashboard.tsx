import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import {
  DollarSign,
  Calendar,
  MessageCircle,
  TrendingUp,
  Car,
  Users,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Sample data for charts
const salesData = [
  { month: "Jan", sales: 45 },
  { month: "Feb", sales: 52 },
  { month: "Mar", sales: 38 },
  { month: "Apr", sales: 61 },
  { month: "May", sales: 55 },
  { month: "Jun", sales: 67 },
];

const revenueData = [
  { month: "Jan", revenue: 45000 },
  { month: "Feb", revenue: 52000 },
  { month: "Mar", revenue: 38000 },
  { month: "Apr", revenue: 61000 },
  { month: "May", revenue: 55000 },
  { month: "Jun", revenue: 67000 },
];

const appointmentData = [
  { name: "Pending", value: 35, color: "#f59e0b" },
  { name: "Completed", value: 45, color: "#10b981" },
  { name: "Cancelled", value: 20, color: "#ef4444" },
];

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Welcome back! Here's what's happening with your dealership today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <StatsCard
            title="Total Sales"
            value="156"
            change="+12% from last month"
            changeType="positive"
            icon={DollarSign}
          />
          <StatsCard
            title="Appointments"
            value="89"
            change="+5% from last week"
            changeType="positive"
            icon={Calendar}
          />
          <StatsCard
            title="Messages"
            value="34"
            change="3 unread"
            changeType="neutral"
            icon={MessageCircle}
          />
          <StatsCard
            title="Revenue"
            value="$324K"
            change="+18% from last month"
            changeType="positive"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
          {/* Sales Chart */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Monthly Sales</CardTitle>
              <CardDescription>
                Number of cars sold over the last 6 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
              <CardDescription>
                Monthly revenue performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-muted-foreground" />
                  <YAxis className="text-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--accent))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Appointment Status */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle>Appointment Status</CardTitle>
              <CardDescription>
                Current appointment distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={appointmentData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {appointmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="dashboard-card lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions in your dealership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    icon: Car,
                    title: "New sale recorded",
                    description: "BMW X5 sold to John Smith",
                    time: "2 hours ago",
                    color: "text-success",
                  },
                  {
                    icon: Calendar,
                    title: "Appointment scheduled",
                    description: "Test drive for Mercedes C-Class",
                    time: "4 hours ago",
                    color: "text-primary",
                  },
                  {
                    icon: MessageCircle,
                    title: "New message received",
                    description: "Inquiry about Audi A4 pricing",
                    time: "6 hours ago",
                    color: "text-accent",
                  },
                  {
                    icon: Users,
                    title: "New user registered",
                    description: "Sales agent Sarah Johnson added",
                    time: "1 day ago",
                    color: "text-muted-foreground",
                  },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-secondary-hover transition-colors">
                    <div className={`p-2 rounded-lg bg-secondary ${activity.color}`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.title}</p>
                      <p className="text-sm text-muted-foreground">{activity.description}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}