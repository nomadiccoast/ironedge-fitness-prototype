import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, TrendingUp, BarChart3, FileText, Megaphone,
  LogOut, Menu, Bell, Sparkles, Copy, Loader2, Search, CalendarDays, UserCheck, Wallet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import type { Member, Payment, AttendanceRecord, Expense } from "@/data/members";
import MemberManagement from "@/components/dashboard/MemberManagement";
import AttendanceTracker from "@/components/dashboard/AttendanceTracker";
import RenewalAlerts from "@/components/dashboard/RenewalAlerts";
import SocialPostGenerator from "@/components/dashboard/SocialPostGenerator";
import AIChatbot from "@/components/chat/AIChatbot";
import ExpensesManagement from "@/components/dashboard/ExpensesManagement";

const SECTIONS = ["overview", "member-mgmt", "attendance", "leads", "revenue", "expenses", "members", "analytics", "ai-reports", "social", "chatbot"] as const;
type Section = typeof SECTIONS[number];

const sidebarItems: { id: Section; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "member-mgmt", label: "Member Mgmt", icon: UserCheck },
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "leads", label: "Leads", icon: Users },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "expenses", label: "Expenses", icon: Wallet },
  { id: "members", label: "Analytics", icon: TrendingUp },
  { id: "analytics", label: "Site Stats", icon: BarChart3 },
  { id: "ai-reports", label: "AI Reports", icon: FileText },
  { id: "chatbot", label: "AI Chatbot", icon: Sparkles },
  { id: "social", label: "Social Posts", icon: Megaphone },
];

const statusColor: Record<string, string> = {
  New: "bg-blue-100 text-blue-700", 
  Called: "bg-yellow-100 text-yellow-700", 
  Converted: "bg-success/20 text-success",
  Paid: "bg-success/20 text-success", 
  Pending: "bg-yellow-100 text-yellow-700",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leadFilter, setLeadFilter] = useState("All");
  const [leadSearch, setLeadSearch] = useState("");
  const [aiReport, setAiReport] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [postType, setPostType] = useState("Membership Offer");
  const [platform, setPlatform] = useState("Instagram");
  const [postContext, setPostContext] = useState("");
  const [generatedPost, setGeneratedPost] = useState("");
  const [postLoading, setPostLoading] = useState(false);

  // Shared state
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [realLeads, setRealLeads] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [gymTier, setGymTier] = useState<string>("Starter"); // Tier state

  // Get gym name and owner name from localStorage
  const gymName = localStorage.getItem("gym_name") || "My Gym";
  const ownerName = localStorage.getItem("owner_name") || "Owner";
  const gymPhone = localStorage.getItem("gym_phone") || "";

  // Feature access based on tier
  const hasGrowthFeatures = gymTier === 'Growth' || gymTier === 'Pro';
  const hasProFeatures = gymTier === 'Pro';

  // Dynamic greeting based on time of day
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    if (localStorage.getItem("Shapefit_auth") !== "true") {
      navigate("/login");
      return;
    }
    let tierSubscription: ReturnType<typeof supabase.channel> | null = null;

    const fetchDashboardData = async () => {
      try {
        // 1. Get the current user
        const { data: { user } } = await supabase.auth.getUser();
        
        // 2. Fetch gym tier from business_accounts and SUBSCRIBE to real-time changes
        if (user) {
          const { data: accountData, error: tierError } = await supabase
            .from('business_accounts')
            .select('tier, gym_name, owner, "phone no."')
            .eq('owner_id', user.id)
            .single();
          
          if (accountData?.tier) {
            setGymTier(accountData.tier);
          }
          if (accountData?.gym_name) localStorage.setItem("gym_name", accountData.gym_name);
          if (accountData?.owner) localStorage.setItem("owner_name", accountData.owner);
          if (accountData?.["phone no."]) localStorage.setItem("gym_phone", accountData["phone no."]);

          // SUBSCRIBE to real-time tier changes
          tierSubscription = supabase
            .channel('business_accounts_changes')
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'business_accounts',
                filter: `owner_id=eq.${user.id}`,
              },
              (payload: any) => {
                if (payload.new?.tier) {
                  setGymTier(payload.new.tier);
                  toast.success(`Plan updated to ${payload.new.tier}!`);
                }
              }
            )
            .subscribe();

        }
      } catch (error) {
        console.error("Error fetching tier data:", error);
      }
    };

    const fetchOtherData = async () => {
      try {
        const { data: membersData } = await supabase.from("members").select("*").order("created_at", { ascending: false });
        if (membersData) {
          // Translate DB snake_case to React camelCase
          const mappedMembers = membersData.map((m: any) => ({
            ...m,
            joinDate: m.join_date || "", // Safety fallback
            expiryDate: m.expiry_date || "",
            amountPaid: m.amount_paid,
            paymentMethod: m.payment_method,
          }));
          setMembers(mappedMembers as any);
        }

        const { data: paymentsData } = await supabase.from("payments").select("*").order("date", { ascending: false });
        if (paymentsData) {
          const mappedPayments = paymentsData.map((p: any) => ({
            ...p,
            memberName: p.member_name,
            memberId: p.member_id,
          }));
          setPayments(mappedPayments as any);
        }

        const { data: leadsData } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
        if (leadsData) {
          // Translate DB snake_case to React camelCase
          const mappedLeads = leadsData.map((l: any) => ({
            ...l,
            status: l.status || "New", // Safety fallback
          }));
          setRealLeads(mappedLeads as any);
        }

        const { data: expensesData } = await supabase.from("expenses").select("*").order("date", { ascending: false });
        if (expensesData) {
          const mappedExpenses = expensesData.map((e: any) => ({
            id: e.id,
            businessId: e.business_id,
            date: e.date,
            category: e.category,
            customCategory: e.custom_category,
            amount: Number(e.amount),
            paymentMethod: e.payment_method,
            note: e.note,
            createdAt: e.created_at,
          }));
          setExpenses(mappedExpenses as any);
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
    fetchOtherData();

    return () => {
      tierSubscription?.unsubscribe();
    };
  }, [navigate]);

  const logout = () => { localStorage.removeItem("Shapefit_auth"); navigate("/login"); };

  const handleUpgradeClick = () => {
    window.open(
      'https://wa.me/919278027491?text=Hi, I want to upgrade my GymOS plan',
      '_blank'
    );
  };

  const generateReport = async () => {
  setAiLoading(true);
  
  try {
    // 1. FRESH FETCH: Get the latest totals directly from the source
    const { data: payData } = await supabase.from('payments').select('amount');
    const { count: leadsCountLive } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    const { data: memberData } = await supabase.from('members').select('status');
    const { data: expenseData } = await supabase.from('expenses').select('amount, category, custom_category');

    // 2. CALCULATE
    const totalRev = (payData || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const activeCount = (memberData || []).filter(m => m.status !== "Inactive").length;
    const alumniCount = (memberData || []).filter(m => m.status === "Inactive").length;
    const leadsCount = leadsCountLive || 0;
    const totalExpenses = (expenseData || []).reduce((sum, e: any) => sum + (Number(e.amount) || 0), 0);
    const netProfit = totalRev - totalExpenses;
    const expenseBreakdown = (expenseData || []).reduce((acc: Record<string, number>, e: any) => {
      const key = e.category === "Other" ? (e.custom_category || "Other") : e.category;
      acc[key] = (acc[key] || 0) + (Number(e.amount) || 0);
      return acc;
    }, {});

    console.log("FINAL DATABASE VERIFICATION:", { activeCount, alumniCount, totalRev, leadsCount, totalExpenses, netProfit });

    // 3. SEND TO AI
    console.log("Invoking ai-report with:", { activeMembers: activeCount, alumniCount, totalRevenue: totalRev, totalLeads: leadsCount, totalExpenses, netProfit, gymName, ownerName });
    
    const { data, error } = await supabase.functions.invoke("ai-report", {
      body: {
        activeMembers: activeCount,
        alumniCount: alumniCount,
        totalRevenue: totalRev,
        totalLeads: leadsCount,
        totalExpenses: totalExpenses,
        netProfit: netProfit,
        expenseBreakdown: expenseBreakdown,
        gymName: gymName,
        ownerName: ownerName
      }
    });

    console.log("AI Report Response:", { data, error });

    if (error) {
      console.error("AI Report Function Error Details:", {
        message: error.message,
        context: error.context,
        status: error.status,
        fullError: error
      });
      throw new Error(`AI Report Error: ${error.message || JSON.stringify(error)}`);
    }
    
    if (!data || !data.content) {
      throw new Error("No content returned from AI Report function. Response: " + JSON.stringify(data));
    }
    
    setAiReport(data.content);
    toast.success("Live business report generated!");

  } catch (err) {
    console.error("Critical Report Error:", err);
    const errorMsg = err instanceof Error ? err.message : "Could not sync with live database.";
    toast.error(errorMsg);
  } finally {
    setAiLoading(false);
  }
};

  const filteredLeads = realLeads.filter(l => {
    if (leadFilter !== "All" && l.status !== leadFilter) return false;
    if (leadSearch && !l.name.toLowerCase().includes(leadSearch.toLowerCase())) return false;
    return true;
  });

  // KPI computations
  const activeMembers = members.filter(m => m.status === "Active" || m.status === "Expiring Soon").length;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const revenueThisMonth = payments.filter(p => p.date.startsWith(currentMonth)).reduce((s, p) => s + p.amount, 0);
  const renewalsDue = members.filter(m => {
    const diff = (new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).length;
  const avgAttendance = members.length > 0 ? Math.round(members.reduce((s, m) => s + (m.attendance || 0), 0) / members.length) : 0;

  const currentMonthLeads = useMemo(() => {
    const key = new Date().toISOString().slice(0, 7);
    return realLeads.filter((l) => String(l.created_at || "").startsWith(key));
  }, [realLeads]);

  const leadsByStatus = useMemo(() => {
    const total = currentMonthLeads.length || 1;
    const converted = currentMonthLeads.filter((l) => l.status === "Converted").length;
    const called = currentMonthLeads.filter((l) => l.status === "Called").length;
    const fresh = currentMonthLeads.filter((l) => l.status === "New").length;
    return {
      total: currentMonthLeads.length,
      converted,
      called,
      fresh,
      conversionRate: Math.round((converted / total) * 100),
    };
  }, [currentMonthLeads]);

  const dailyLeadData = useMemo(() => {
    const today = new Date();
    const list: { day: string; visitors: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const count = realLeads.filter((l) => String(l.created_at || "").slice(0, 10) === key).length;
      list.push({ day: d.getDate().toString(), visitors: count });
    }
    return list;
  }, [realLeads]);

  // Revenue last 6 months
  const revenueData = useMemo(() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const rev = payments.filter(p => p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
      months.push({ month: label, revenue: rev });
    }
    return months;
  }, [payments]);

// Member Pie
  const realMemberPie = useMemo(() => {
    return [
      { 
        name: "1 Month", 
        // Catches the new "1" and the old "Monthly"
        value: members.filter(m => m.plan === "1" || m.plan === "Monthly").length, 
        color: "hsl(220,9%,46%)" 
      },
      { 
        name: "2-6 Months", 
        // Catches new mid-term plans and old "Quarterly"
        value: members.filter(m => ["2", "3", "4", "5", "6"].includes(String(m.plan)) || m.plan === "Quarterly").length, 
        color: "hsl(351,79%,59%)" 
      },
      { 
        name: "7-12 Months", 
        // Catches new long-term plans and old "Annual"
        value: members.filter(m => ["7", "8", "9", "10", "11", "12"].includes(String(m.plan)) || m.plan === "Annual").length, 
        color: "hsl(240,33%,14%)" 
      },
    ];
  }, [members]);
  // Member Growth
  const realMemberGrowth = useMemo(() => {
    const months: { month: string; members: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const yearMonth = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const membersUpToMonth = members.filter(m => m.joinDate.slice(0, 7) <= yearMonth).length;
      months.push({ month: label, members: membersUpToMonth });
    }
    return months;
  }, [members]);

  const renderSection = () => {
    switch (section) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Active Members", value: activeMembers.toString(), change: "real-time", icon: Users },
                { label: "Revenue This Month", value: `₹${revenueThisMonth.toLocaleString("en-IN")}`, change: "real-time", icon: DollarSign },
                { label: "Renewals Due", value: renewalsDue.toString(), change: "action needed", icon: Bell },
                { label: "Total Leads", value: realLeads.length.toString(), change: "web traffic", icon: BarChart3 },
              ].map(kpi => (
                <div key={kpi.label} className="bg-card border border-border rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{kpi.label}</span>
                    <kpi.icon className="h-5 w-5 text-accent" />
                  </div>
                  <p className="text-2xl font-bold text-primary">{kpi.value}</p>
                  <span className="text-xs text-success font-medium">{kpi.change}</span>
                </div>
              ))}
            </div>

            <RenewalAlerts members={members} gymPhone={gymPhone} />

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-primary mb-4">Revenue — Last 6 Months</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="month" stroke="hsl(220,9%,46%)" fontSize={12} />
                  <YAxis stroke="hsl(220,9%,46%)" fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(351,79%,59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "member-mgmt":
        return <MemberManagement members={members} setMembers={setMembers} payments={payments} setPayments={setPayments} gymTier={gymTier} />;

      case "attendance":
        return <AttendanceTracker members={members} attendance={attendance} setAttendance={setAttendance} />;

      case "leads":
        return (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input value={leadSearch} onChange={e => setLeadSearch(e.target.value)} placeholder="Search leads..."
                  className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-card" />
              </div>
              <select value={leadFilter} onChange={e => setLeadFilter(e.target.value)}
                className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
                {["All", "New", "Called", "Converted"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary">
                  {["Name", "Phone", "Gym Name", "City", "Date", "Status"].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {filteredLeads.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No leads found in database.</td></tr>
                  ) : (
                    filteredLeads.map((l, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-4 py-3 font-medium text-primary">{l.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.phone}</td>
                        <td className="px-4 py-3">{l.gym_name || "—"}</td>
                        <td className="px-4 py-3">{l.city || "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(l.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[l.status] || "bg-secondary text-foreground"}`}>{l.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "revenue":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground">Revenue This Month</p>
                <p className="text-2xl font-bold text-primary">₹{revenueThisMonth.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground">Total Payments</p>
                <p className="text-2xl font-bold text-primary">{payments.length}</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Revenue — Last 6 Months</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="month" stroke="hsl(220,9%,46%)" fontSize={12} />
                  <YAxis stroke="hsl(220,9%,46%)" fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString("en-IN")}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill="hsl(351,79%,59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-secondary">
                  {["Member", "Date", "Amount", "Method", "Plan", "Note"].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {payments.slice().reverse().map(p => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-primary">{p.memberName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.date}</td>
                      <td className="px-4 py-3">₹{p.amount.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.method}</td>
                      <td className="px-4 py-3">{p.plan}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case "expenses":
        return <ExpensesManagement expenses={expenses} setExpenses={setExpenses} />;

      case "members":
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4">Active Members by Plan</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={realMemberPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {realMemberPie.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4">Churn Rate</h3>
                <p className="text-4xl font-bold text-primary">0%</p>
                <p className="text-sm text-muted-foreground">this month</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Member Growth — Last 12 Months</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={realMemberGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="month" stroke="hsl(220,9%,46%)" fontSize={12} />
                  <YAxis stroke="hsl(220,9%,46%)" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="members" stroke="hsl(240,33%,14%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );

      case "analytics":
        return hasGrowthFeatures ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Leads This Month", value: leadsByStatus.total.toString() },
                { label: "Converted Leads", value: leadsByStatus.converted.toString() },
                { label: "Called Leads", value: leadsByStatus.called.toString() },
                { label: "Conversion Rate", value: `${leadsByStatus.conversionRate}%` },
              ].map(m => (
                <div key={m.label} className="bg-card border border-border rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold text-primary">{m.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Daily Leads — Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyLeadData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="day" stroke="hsl(220,9%,46%)" fontSize={12} />
                  <YAxis stroke="hsl(220,9%,46%)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="hsl(351,79%,59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Lead Pipeline Breakdown</h3>
              {[
                { source: "New", pct: leadsByStatus.total ? Math.round((leadsByStatus.fresh / leadsByStatus.total) * 100) : 0 },
                { source: "Called", pct: leadsByStatus.total ? Math.round((leadsByStatus.called / leadsByStatus.total) * 100) : 0 },
                { source: "Converted", pct: leadsByStatus.total ? Math.round((leadsByStatus.converted / leadsByStatus.total) * 100) : 0 },
              ].map(t => (
                <div key={t.source} className="flex items-center gap-3 mb-3">
                  <span className="text-sm w-36 text-foreground">{t.source}</span>
                  <div className="flex-1 bg-secondary rounded-full h-3">
                    <div className="bg-accent h-3 rounded-full" style={{ width: `${t.pct}%` }} />
                  </div>
                  <span className="text-sm font-medium text-primary w-10 text-right">{t.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-10 text-center max-w-2xl mx-auto mt-10">
            <h3 className="text-xl font-bold text-primary mb-2">Growth Plan Feature</h3>
            <p className="text-muted-foreground mb-6">
              Advanced Analytics is available on the Growth plan (₹3,000/month). Track detailed visitor data, traffic sources, and site performance.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleUpgradeClick}>
              Upgrade to Growth
            </Button>
          </div>
        );

      case "ai-reports":
        return hasGrowthFeatures ? (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" /> AI Business Report
                </h3>
                <div className="flex gap-2">
                  {aiReport && <Button variant="outline" size="sm" onClick={generateReport}>Regenerate</Button>}
                  <Button variant="outline" size="sm" disabled>Download as PDF</Button>
                </div>
              </div>
              {!aiReport && !aiLoading && (
                <Button onClick={generateReport} className="bg-accent hover:bg-accent/90 gap-2">
                  <Sparkles className="h-4 w-4" /> Generate This Week's Report
                </Button>
              )}
              {aiLoading && (
                <div className="space-y-3">{[1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-secondary rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />)}</div>
              )}
              {aiReport && <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">{aiReport}</div>}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-10 text-center max-w-2xl mx-auto mt-10">
            <h3 className="text-xl font-bold text-primary mb-2">Growth Plan Feature</h3>
            <p className="text-muted-foreground mb-6">
              AI Business Reports are available on the Growth plan (₹3,000/month). Get AI-powered insights into your gym performance, trends, and recommendations.
            </p>
            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleUpgradeClick}>
              Upgrade to Growth
            </Button>
          </div>
        );

      case "social":
        return hasProFeatures ? (
          <SocialPostGenerator postType={postType} setPostType={setPostType} platform={platform} setPlatform={setPlatform} postContext={postContext} setPostContext={setPostContext} generatedPost={generatedPost} setGeneratedPost={setGeneratedPost} postLoading={postLoading} setPostLoading={setPostLoading} gymPhone={gymPhone} />
        ) : (
          <div className="bg-card border border-border rounded-xl p-10 text-center max-w-2xl mx-auto mt-10">
            <h3 className="text-xl font-bold text-primary mb-2">Pro Plan Feature</h3>
            <p className="text-muted-foreground mb-6">The Social Media Post Generator is available on the Pro plan (₹5,000/month).</p>
            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleUpgradeClick}>
              Upgrade to Pro
            </Button>
          </div>
        );

      case "chatbot":
        return hasProFeatures ? (
          <AIChatbot />
        ) : (
          <div className="bg-card border border-border rounded-xl p-10 text-center max-w-2xl mx-auto mt-10">
            <h3 className="text-xl font-bold text-primary mb-2">Pro Plan Feature</h3>
            <p className="text-muted-foreground mb-6">The Hinglish AI Chatbot is available on the Pro plan (₹5,000/month). It handles member queries in Hindi and English.</p>
            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleUpgradeClick}>
              Upgrade to Pro
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-sidebar-border">
          <span className="font-display font-bold text-lg">{gymName}</span>
        </div>
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => { setSection(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${section === item.id ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50"}`}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/50 transition-colors">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
            <div>
              <p className="font-semibold text-primary text-sm">{getTimeBasedGreeting()}, {ownerName} 👋</p>
              <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
          </div>
          <button className="p-2 rounded-lg hover:bg-secondary"><Bell className="h-5 w-5 text-muted-foreground" /></button>
        </header>

        <div className="p-4 lg:p-6">
          <h2 className="text-xl font-display font-bold text-primary mb-6 capitalize">
            {section.replace(/-/g, " ")}
          </h2>
          {renderSection()}
        </div>
      </main>
    </div>
  );
}