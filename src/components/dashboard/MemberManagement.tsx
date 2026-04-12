import { useState, useEffect } from "react";
import { Search, Plus, Download, Edit2, Trash2, X, Sparkles, Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Member, Payment } from "@/data/members";

interface Props {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
}

const emptyMember: Omit<Member, "id" | "status" | "attendance" | "expiryDate"> = {
  name: "", phone: "", email: "", age: 25, weight: 70, height: 170,
  plan: "Monthly", amountPaid: 1500, paymentMethod: "UPI", joinDate: new Date().toISOString().split("T")[0],
};

function calcExpiry(joinDate: string, plan: string): string {
  const d = new Date(joinDate);
  if (plan === "Monthly") d.setMonth(d.getMonth() + 1);
  else if (plan === "Quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

function calcStatus(expiryDate: string): Member["status"] {
  const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "Expired";
  if (diff <= 7) return "Expiring Soon";
  return "Active";
}

export default function MemberManagement({ members, setMembers, payments, setPayments }: Props) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyMember);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [dietGoal, setDietGoal] = useState("Weight Loss");
  const [dietPlan, setDietPlan] = useState("");
  const [dietLoading, setDietLoading] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payForm, setPayForm] = useState({ amount: 1500, method: "UPI" as "Cash" | "UPI" | "Card", plan: "Monthly" as "Monthly" | "Quarterly" | "Annual", note: "" });
  const [saving, setSaving] = useState(false);

  // 🔥 THE FIX: Fetch data from Supabase immediately when the page loads
  useEffect(() => {
    const fetchEverything = async () => {
      try {
        console.log("🚨 TRACKER: Fetching data from Supabase on load...");
        
        // Fetch Members
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });

        if (membersError) throw membersError;
        if (membersData) {
          setMembers(membersData as any);
        }

        // Fetch Payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("date", { ascending: false });

        if (paymentsError) throw paymentsError;
        if (paymentsData) {
          setPayments(paymentsData as any);
        }
      } catch (error) {
        console.error("🚨 TRACKER: Error fetching data:", error);
      }
    };

    fetchEverything();
  }, [setMembers, setPayments]);

  const filtered = members.filter(m => {
    if (planFilter !== "All" && m.plan !== planFilter) return false;
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.phone.includes(search)) return false;
    return true;
  });

  const openAdd = () => { setForm(emptyMember); setEditId(null); setModalOpen(true); };
  const openEdit = (m: Member) => {
    setForm({ name: m.name, phone: m.phone, email: m.email, age: m.age, weight: m.weight, height: m.height, plan: m.plan, amountPaid: m.amountPaid, paymentMethod: m.paymentMethod, joinDate: m.joinDate });
    setEditId(m.id);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    setSaving(true);
    const expiryDate = calcExpiry(form.joinDate, form.plan);
    const status = calcStatus(expiryDate);

    console.log("🚨 TRACKER: Starting Save Process for", form.name);

    try {
      if (editId) {
        const { error } = await supabase.from("members" as any).update({
          name: form.name, phone: form.phone, email: form.email, age: form.age,
          weight: form.weight, height: form.height, plan: form.plan,
          amountPaid: form.amountPaid, paymentMethod: form.paymentMethod,
          joinDate: form.joinDate, expiryDate, status,
        }).eq("id", editId);
        if (error) throw error;
        setMembers(prev => prev.map(m => m.id === editId ? { ...m, ...form, expiryDate, status } : m));
        toast.success("Member updated!");
      } else {
        const payload = {
          name: form.name, phone: form.phone, email: form.email, age: form.age,
          weight: form.weight, height: form.height, plan: form.plan,
          amountPaid: form.amountPaid, paymentMethod: form.paymentMethod,
          joinDate: form.joinDate, expiryDate, status, attendance: 0,
        };
        
        console.log("🚨 TRACKER: Sending this exact payload to Supabase:", payload);

        const { data: rawData, error } = await supabase.from("members" as any).insert(payload).select().single();
        
        if (error) {
          console.error("🚨 TRACKER: Supabase rejected the insert! Reason:", error);
          throw error;
        }

        console.log("🚨 TRACKER: Supabase accepted the insert! Returned Data:", rawData);

        const data = rawData as any;
        const newMember: Member = {
          id: data.id, name: data.name, phone: data.phone, email: data.email || "",
          age: data.age, weight: data.weight, height: data.height, plan: data.plan,
          amountPaid: data.amountPaid, paymentMethod: data.paymentMethod,
          joinDate: data.joinDate, expiryDate: data.expiryDate,
          attendance: data.attendance || 0, status: data.status,
        };
        setMembers(prev => [...prev, newMember]);

        // Also save payment record
        await supabase.from("payments" as any).insert({
          memberId: data.id, memberName: form.name, date: form.joinDate,
          amount: form.amountPaid, method: form.paymentMethod, plan: form.plan, recordedBy: "Vikram",
        });
        setPayments(prev => [...prev, {
          id: `p${data.id}`, memberId: data.id, memberName: form.name,
          date: form.joinDate, amount: form.amountPaid, method: form.paymentMethod,
          plan: form.plan, recordedBy: "Vikram",
        }]);
        toast.success("Member added!");
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error("🚨 TRACKER: Caught an error in catch block:", err);
      toast.error(err.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase.from("members" as any).delete().eq("id", id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== id));
      setDeleteConfirm(null);
      toast.success("Member deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete member");
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Plan", "Amount Paid", "Join Date", "Expiry Date", "Attendance %", "Status"];
    const rows = members.map(m => [m.name, m.phone, m.plan, m.amountPaid, m.joinDate, m.expiryDate, m.attendance, m.status]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "members.csv"; a.click();
    toast.success("CSV exported!");
  };

  const generateDiet = async (member: Member) => {
    setDietLoading(true);
    setDietPlan("");
    
    try {
      console.log("🚨 TRACKER: Generating mock diet plan to prevent CORS crash.");
      // Fake delay to simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockPlan = `Custom Diet Plan for ${member.name}
Goal: ${dietGoal}

Breakfast: 
- 4 Egg whites, 1 whole egg
- 1 bowl of Oats with skimmed milk
- 1 Apple

Lunch:
- 150g Grilled Chicken breast
- 1 cup Brown Rice
- Mixed green salad

Dinner:
- 150g Grilled Fish (Tilapia/Basa)
- Steamed Broccoli

(Note: AI Backend is currently offline. This is a placeholder plan.)`;

      setDietPlan(mockPlan);
    } catch (err) {
      toast.error("Failed to generate diet plan");
    } finally {
      setDietLoading(false);
    }
  };

  const sendDietWhatsApp = (phone: string) => {
    const text = encodeURIComponent(dietPlan);
    window.open(`https://wa.me/91${phone}?text=${text}`, "_blank");
  };

  const addPayment = async () => {
    if (!selectedMember) return;
    try {
      const paymentData = {
        memberId: selectedMember.id, memberName: selectedMember.name,
        date: new Date().toISOString().split("T")[0], amount: payForm.amount,
        method: payForm.method, plan: payForm.plan, recordedBy: "Vikram",
        note: payForm.note || null,
      };
      const { data: rawPay, error } = await supabase.from("payments" as any).insert(paymentData).select().single();
      if (error) throw error;
      const pd = rawPay as any;
      const p: Payment = {
        id: pd.id, memberId: pd.memberId, memberName: pd.memberName,
        date: pd.date, amount: pd.amount, method: pd.method,
        plan: pd.plan, recordedBy: pd.recordedBy, note: pd.note || undefined,
      };
      setPayments(prev => [...prev, p]);
      setPaymentModal(false);
      setPayForm({ amount: 1500, method: "UPI", plan: "Monthly", note: "" });
      toast.success("Payment recorded!");
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    }
  };

  const memberPayments = selectedMember ? payments.filter(p => p.memberId === selectedMember.id) : [];

  const statusBadge = (s: string) => {
    if (s === "Active") return "bg-success/20 text-success";
    if (s === "Expired") return "bg-destructive/20 text-destructive";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-card" />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
          {["All", "Monthly", "Quarterly", "Annual"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
          {["All", "Active", "Expired", "Expiring Soon"].map(s => <option key={s}>{s}</option>)}
        </select>
        <Button onClick={openAdd} className="bg-accent hover:bg-accent/90 gap-2"><Plus className="h-4 w-4" /> Add Member</Button>
        <Button onClick={exportCSV} variant="outline" className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary">
            {["Name", "Phone", "Plan", "₹ Paid", "Join", "Expiry", "Attendance", "Status", "Actions"].map(h =>
              <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
            )}
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t border-border hover:bg-secondary/30 cursor-pointer" onClick={() => { setSelectedMember(m); setDietPlan(""); }}>
                <td className="px-4 py-3 font-medium text-primary">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                <td className="px-4 py-3">{m.plan}</td>
                <td className="px-4 py-3">₹{m.amountPaid.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.joinDate}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.expiryDate}</td>
                <td className="px-4 py-3">{m.attendance}%</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-secondary"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 rounded hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-primary mb-2">Delete Member?</h3>
            <p className="text-sm text-muted-foreground mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMember(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-card rounded-t-xl sm:rounded-xl p-6 max-w-lg w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-primary">{editId ? "Edit Member" : "Add New Member"}</h3>
              <button onClick={() => setModalOpen(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Name", key: "name", type: "text" },
                { label: "Phone", key: "phone", type: "tel" },
                { label: "Email", key: "email", type: "email" },
                { label: "Age", key: "age", type: "number" },
                { label: "Weight (kg)", key: "weight", type: "number" },
                { label: "Height (cm)", key: "height", type: "number" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                  <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                    className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Plan Type</label>
                <select value={form.plan} onChange={e => setForm(prev => ({ ...prev, plan: e.target.value as any }))}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
                  {["Monthly", "Quarterly", "Annual"].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Amount Paid (₹)</label>
                <input type="number" value={form.amountPaid} onChange={e => setForm(prev => ({ ...prev, amountPaid: Number(e.target.value) }))}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                <select value={form.paymentMethod} onChange={e => setForm(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
                  {["Cash", "UPI", "Card"].map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Join Date</label>
                <input type="date" value={form.joinDate} onChange={e => setForm(prev => ({ ...prev, joinDate: e.target.value }))}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full mt-4 bg-accent hover:bg-accent/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? "Update Member" : "Add Member"}
            </Button>
          </div>
        </div>
      )}

      {selectedMember && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedMember(null)}>
          <div className="bg-card rounded-t-xl sm:rounded-xl p-6 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-primary text-lg">{selectedMember.name}</h3>
              <button onClick={() => setSelectedMember(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Phone", value: selectedMember.phone },
                { label: "Plan", value: selectedMember.plan },
                { label: "Status", value: selectedMember.status },
                { label: "Attendance", value: `${selectedMember.attendance}%` },
                { label: "Age", value: `${selectedMember.age} yrs` },
                { label: "Weight", value: `${selectedMember.weight} kg` },
                { label: "Height", value: `${selectedMember.height} cm` },
                { label: "Expiry", value: selectedMember.expiryDate },
              ].map(i => (
                <div key={i.label} className="bg-secondary rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">{i.label}</p>
                  <p className="text-sm font-medium text-primary">{i.value}</p>
                </div>
              ))}
            </div>

            <div className="border border-border rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> AI Diet Plan Generator
              </h4>
              <div className="flex gap-3 mb-3">
                <select value={dietGoal} onChange={e => setDietGoal(e.target.value)}
                  className="border border-border rounded-lg px-3 py-2 text-sm bg-background flex-1">
                  {["Weight Loss", "Muscle Gain", "Maintenance"].map(g => <option key={g}>{g}</option>)}
                </select>
                <Button onClick={() => generateDiet(selectedMember)} disabled={dietLoading} className="bg-accent hover:bg-accent/90 gap-2">
                  {dietLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Generate
                </Button>
              </div>
              {dietLoading && (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-3 bg-secondary rounded animate-pulse" style={{ width: `${90 - i * 10}%` }} />)}
                </div>
              )}
              {dietPlan && (
                <div className="bg-secondary/50 rounded-lg p-4 mt-2">
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-xs">{dietPlan}</div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(dietPlan); toast.success("Copied!"); }} className="gap-1">
                      <Copy className="h-3 w-3" /> Copy Diet Plan
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => sendDietWhatsApp(selectedMember.phone)} className="gap-1 text-success border-success/30">
                      📱 Send on WhatsApp
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="border border-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-primary text-sm">Payment History</h4>
                <Button size="sm" variant="outline" onClick={() => setPaymentModal(true)} className="gap-1">
                  <Plus className="h-3 w-3" /> Add Payment
                </Button>
              </div>
              {memberPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead><tr className="bg-secondary">
                    {["Date", "Amount", "Method", "Plan", "By", "Note"].map(h =>
                      <th key={h} className="px-3 py-2 text-left text-muted-foreground">{h}</th>
                    )}
                  </tr></thead>
                  <tbody>
                    {memberPayments.map(p => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2">{p.date}</td>
                        <td className="px-3 py-2">₹{p.amount.toLocaleString("en-IN")}</td>
                        <td className="px-3 py-2">{p.method}</td>
                        <td className="px-3 py-2">{p.plan}</td>
                        <td className="px-3 py-2">{p.recordedBy}</td>
                        <td className="px-3 py-2 text-muted-foreground">{p.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {paymentModal && (
              <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" onClick={() => setPaymentModal(false)}>
                <div className="bg-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                  <h3 className="font-semibold text-primary mb-4">Record Payment</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                      <input type="number" value={payForm.amount} onChange={e => setPayForm(p => ({ ...p, amount: Number(e.target.value) }))}
                        className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Method</label>
                      <select value={payForm.method} onChange={e => setPayForm(p => ({ ...p, method: e.target.value as any }))}
                        className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
                        {["Cash", "UPI", "Card"].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Plan</label>
                      <select value={payForm.plan} onChange={e => setPayForm(p => ({ ...p, plan: e.target.value as any }))}
                        className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
                        {["Monthly", "Quarterly", "Annual"].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Note</label>
                      <input value={payForm.note} onChange={e => setPayForm(p => ({ ...p, note: e.target.value }))}
                        className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" placeholder="Optional note..." />
                    </div>
                  </div>
                  <Button onClick={addPayment} className="w-full mt-4 bg-accent hover:bg-accent/90">Record Payment</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}