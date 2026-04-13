import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, DollarSign, TrendingUp, BarChart3, FileText, Megaphone,
  LogOut, Menu, Bell, Sparkles, Copy, Loader2, Search, CalendarDays, UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";
import { initialMembers, initialPayments, generateAttendanceRecords } from "@/data/members";
import type { Member, Payment, AttendanceRecord } from "@/data/members";
import MemberManagement from "@/components/dashboard/MemberManagement";
import AttendanceTracker from "@/components/dashboard/AttendanceTracker";
import RenewalAlerts from "@/components/dashboard/RenewalAlerts";
import SocialPostGenerator from "@/components/dashboard/SocialPostGenerator";

const SECTIONS = ["overview", "member-mgmt", "attendance", "leads", "revenue", "members", "analytics", "ai-reports", "social"] as const;
type Section = typeof SECTIONS[number];

const sidebarItems: { id: Section; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "member-mgmt", label: "Member Mgmt", icon: UserCheck },
  { id: "attendance", label: "Attendance", icon: CalendarDays },
  { id: "leads", label: "Leads", icon: Users },
  { id: "revenue", label: "Revenue", icon: DollarSign },
  { id: "members", label: "Analytics", icon: TrendingUp },
  { id: "analytics", label: "Site Stats", icon: BarChart3 },
  { id: "ai-reports", label: "AI Reports", icon: FileText },
  { id: "social", label: "Social Posts", icon: Megaphone },
];

const leads = [
  { name: "Ankit Gupta", phone: "98765 43210", plan: "Pro", date: "Mar 15", status: "New" },
  { name: "Sneha Yadav", phone: "91234 56789", plan: "Elite", date: "Mar 14", status: "Called" },
  { name: "Ravi Kumar", phone: "97654 32100", plan: "Basic", date: "Mar 14", status: "Converted" },
  { name: "Pooja Mishra", phone: "93456 78901", plan: "Pro", date: "Mar 13", status: "New" },
  { name: "Deepak Tiwari", phone: "99876 54321", plan: "Pro", date: "Mar 12", status: "Called" },
  { name: "Nisha Agarwal", phone: "90123 45678", plan: "Elite", date: "Mar 11", status: "Converted" },
  { name: "Vikas Pandey", phone: "98012 34567", plan: "Basic", date: "Mar 10", status: "New" },
  { name: "Kavita Singh", phone: "97012 34567", plan: "Pro", date: "Mar 9", status: "New" },
];

const memberPie = [
  { name: "Basic", value: 420, color: "hsl(220,9%,46%)" },
  { name: "Pro", value: 580, color: "hsl(351,79%,59%)" },
  { name: "Elite", value: 247, color: "hsl(240,33%,14%)" },
];

const memberGrowth = Array.from({ length: 12 }, (_, i) => ({
  month: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"][i],
  members: 800 + i * 40 + Math.round(Math.random() * 30),
}));

const dailyVisitors = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  visitors: 40 + Math.round(Math.random() * 40),
}));

const statusColor: Record<string, string> = {
  New: "bg-blue-100 text-blue-700", Called: "bg-yellow-100 text-yellow-700", Converted: "bg-success/20 text-success",
  Paid: "bg-success/20 text-success", Pending: "bg-yellow-100 text-yellow-700",
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
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => generateAttendanceRecords());

  useEffect(() => {
    if (localStorage.getItem("ironedge_auth") !== "true") navigate("/login");
  }, [navigate]);

  const logout = () => { localStorage.removeItem("ironedge_auth"); navigate("/login"); };

  const generateReport = async () => {
    setAiLoading(true); setAiReport("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-report", {});
      if (error) throw error;
      setAiReport(data.content);
    } catch { toast.error("Failed to generate report."); }
    finally { setAiLoading(false); }
  };

  const filteredLeads = leads.filter(l => {
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
  const avgAttendance = members.length > 0 ? Math.round(members.reduce((s, m) => s + m.attendance, 0) / members.length) : 0;

  // Revenue last 6 months
  const revenueData = useMemo(() => {
    const months: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const key = d.toISOString().slice(0, 7);
      const label = d.toLocaleString("en-IN", { month: "short" });
      const rev = payments.filter(p => p.date.startsWith(key)).reduce((s, p) => s + p.amount, 0);
      months.push({ month: label, revenue: rev || (165000 + (5 - i) * 10000) }); // fallback mock
    }
    return months;
  }, [payments]);

  const renderSection = () => {
    switch (section) {
      case "overview":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Total Active Members", value: activeMembers.toString(), change: "↑ 8%", icon: Users },
                { label: "Revenue This Month", value: `₹${revenueThisMonth.toLocaleString("en-IN")}`, change: "↑ 12%", icon: DollarSign },
                { label: "Renewals Due This Week", value: renewalsDue.toString(), change: "action needed", icon: Bell },
                { label: "Avg Attendance Rate", value: `${avgAttendance}%`, change: "this month", icon: BarChart3 },
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

            {/* Renewal Alerts */}
            <RenewalAlerts members={members} />

            {/* Revenue Chart */}
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
        return <MemberManagement members={members} setMembers={setMembers} payments={payments} setPayments={setPayments} />;

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
                  {["Name", "Phone", "Plan", "Date", "Status"].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium">{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {filteredLeads.map((l, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-4 py-3 font-medium text-primary">{l.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.phone}</td>
                      <td className="px-4 py-3">{l.plan}</td>
                      <td className="px-4 py-3 text-muted-foreground">{l.date}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[l.status]}`}>{l.status}</span></td>
                    </tr>
                  ))}
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

      case "members":
        return (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4">Active Members by Plan</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={memberPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {memberPie.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-semibold text-primary mb-4">Churn Rate</h3>
                <p className="text-4xl font-bold text-primary">3.2%</p>
                <p className="text-sm text-muted-foreground">this month</p>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Member Growth — Last 12 Months</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={memberGrowth}>
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
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Bounce Rate", value: "32%" },
                { label: "Avg. Session", value: "2m 45s" },
                { label: "Page Views", value: "8,420" },
                { label: "Unique Visitors", value: "1,820" },
              ].map(m => (
                <div key={m.label} className="bg-card border border-border rounded-xl p-5">
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold text-primary">{m.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Daily Visitors — Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyVisitors}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,13%,91%)" />
                  <XAxis dataKey="day" stroke="hsl(220,9%,46%)" fontSize={12} />
                  <YAxis stroke="hsl(220,9%,46%)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="visitors" fill="hsl(351,79%,59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-primary mb-4">Top Traffic Sources</h3>
              {[
                { source: "Direct", pct: 38 },
                { source: "Google", pct: 28 },
                { source: "WhatsApp Referral", pct: 20 },
                { source: "Instagram", pct: 14 },
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
        );

      case "ai-reports":
        return (
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
        );

      case "social":
        return <SocialPostGenerator postType={postType} setPostType={setPostType} platform={platform} setPlatform={setPlatform} postContext={postContext} setPostContext={setPostContext} generatedPost={generatedPost} setGeneratedPost={setGeneratedPost} postLoading={postLoading} setPostLoading={setPostLoading} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-sidebar-foreground transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-sidebar-border">
          <span className="font-display font-bold text-lg">IronEdge</span>
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
              <p className="font-semibold text-primary text-sm">Good morning, Vikram 👋</p>
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
