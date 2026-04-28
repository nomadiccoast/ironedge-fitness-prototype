import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Download, Edit2, Trash2, X, Sparkles, Copy, Loader2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Member, Payment } from "@/data/members";
import posthog from "posthog-js";

interface Props {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  gymTier?: string; // Optional tier prop
}

const emptyMember: Omit<Member, "id" | "status" | "attendance" | "expiryDate"> = {
  name: "", phone: "", email: "", age: 25, weight: 70, height: 170,
  plan: "Monthly", amountPaid: 1500, paymentMethod: "UPI", joinDate: new Date().toISOString().split("T")[0],
  total_fee: 1500, balance_due: 0, next_due_date: "",
};

function calcExpiry(joinDate: string, plan: string): string {
  const d = new Date(joinDate);
  if (plan === "Monthly") d.setMonth(d.getMonth() + 1);
  else if (plan === "Quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

function calcStatus(expiryDate: string, overrideStatus?: string): Member["status"] {
  if (overrideStatus === "Inactive") return "Inactive";
  const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return "Expired";
  if (diff <= 7) return "Expiring Soon";
  return "Active";
}

export default function MemberManagement({ members, setMembers, payments, setPayments, gymTier }: Props) {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showInactive, setShowInactive] = useState(false);
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
  const [memberAttendance, setMemberAttendance] = useState<Array<{ id: string; date: string; status: string }>>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Feature access based on tier
  const hasGrowthFeatures = gymTier === 'Growth' || gymTier === 'Pro';

  const recordedByName = localStorage.getItem("owner_name") || "Owner";

  const handleUpgradeClick = () => {
    window.open(
      'https://wa.me/919278027491?text=Hi, I want to upgrade my GymOS plan',
      '_blank'
    );
  };

  useEffect(() => {
    const fetchEverything = async () => {
      try {
        // --- 1. FETCH & TRANSLATE MEMBERS ---
        const { data: membersData, error: membersError } = await supabase
          .from("members")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (membersError) throw membersError;
        
        if (membersData) {
          // Translate snake_case database columns to camelCase React state
          const mappedMembers = membersData.map((dbMember: any) => ({
            ...dbMember,
            amountPaid: dbMember.amount_paid,
            paymentMethod: dbMember.payment_method,
            joinDate: dbMember.join_date,
            expiryDate: dbMember.expiry_date,
          }));
          setMembers(mappedMembers as any);
        }

        // --- 2. FETCH & TRANSLATE PAYMENTS ---
        const { data: paymentsData, error: paymentsError } = await supabase
          .from("payments")
          .select("*")
          .order("date", { ascending: false });
          
        if (paymentsError) throw paymentsError;
        
        if (paymentsData) {
          // Translate snake_case database columns to camelCase React state
          const mappedPayments = paymentsData.map((dbPayment: any) => ({
            ...dbPayment,
            memberId: dbPayment.member_id,
            memberName: dbPayment.member_name,
            recordedBy: dbPayment.recorded_by,
          }));
          setPayments(mappedPayments as any);
        }

      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchEverything();
  }, [setMembers, setPayments]);

  const filtered = members.filter(m => {
    if (!showInactive && m.status === "Inactive") return false;
    if (showInactive && m.status !== "Inactive") return false;

    if (planFilter !== "All" && m.plan !== planFilter) return false;
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.phone.includes(search)) return false;
    return true;
  });

  const openAdd = () => { setForm(emptyMember); setEditId(null); setModalOpen(true); };
  const openEdit = (m: Member) => {
    setForm({ 
      name: m.name, phone: m.phone, email: m.email || "", age: m.age || 25, weight: m.weight, height: m.height, 
      plan: m.plan, amountPaid: m.amountPaid, paymentMethod: m.paymentMethod, joinDate: m.joinDate,
      total_fee: m.total_fee || m.amountPaid, 
      balance_due: m.balance_due || 0, 
      next_due_date: m.next_due_date || "",
    });
    setEditId(m.id);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name || !form.phone) { toast.error("Name and phone are required"); return; }
    setSaving(true);
    
    const expiryDate = calcExpiry(form.joinDate, form.plan);
    const calculatedBalance = (form.total_fee || 0) - form.amountPaid;
    const businessId = localStorage.getItem("business_id");
    
    if (!businessId) {
      toast.error("Business ID not found. Please log in again.");
      setSaving(false);
      return;
    }

    const existingMember = members.find(m => m.id === editId);
    const finalStatus = calcStatus(expiryDate, existingMember?.status === "Inactive" ? "Inactive" : undefined);

    const payload = {
      name: form.name, phone: form.phone, email: form.email, age: form.age,
      weight: form.weight, height: form.height, plan: form.plan,
      amount_paid: form.amountPaid, payment_method: form.paymentMethod,
      join_date: form.joinDate, expiry_date: expiryDate, status: finalStatus,
      total_fee: form.total_fee, balance_due: calculatedBalance, next_due_date: form.next_due_date || null,
      business_id: businessId
    };

    // State payload with camelCase for Member type
    const statePayload = {
      name: form.name, phone: form.phone, email: form.email, age: form.age,
      weight: form.weight, height: form.height, plan: form.plan,
      amountPaid: form.amountPaid, paymentMethod: form.paymentMethod,
      joinDate: form.joinDate, expiryDate, status: finalStatus,
      total_fee: form.total_fee, balance_due: calculatedBalance, next_due_date: form.next_due_date || null
    };

    try {
      if (editId) {
        const { error } = await supabase.from("members" as any).update(payload).eq("id", editId);
        if (error) throw error;
        setMembers(prev => prev.map(m => m.id === editId ? { ...m, ...statePayload } : m));
        toast.success("Member updated!");
      } else {
        const insertStatePayload = { ...statePayload, attendance: 0 };
        const { data: rawData, error } = await supabase.from("members" as any).insert(payload).select().single();
        if (error) throw error;
        
        const data = rawData as any;
        setMembers(prev => [...prev, { ...insertStatePayload, id: data.id }]);

        await supabase.from("payments" as any).insert({
          member_id: data.id, member_name: form.name, date: form.joinDate,
          amount: form.amountPaid, method: form.paymentMethod, plan: form.plan, recorded_by: recordedByName,
          business_id: businessId
        });
        
        setPayments(prev => [...prev, {
          id: `p${data.id}`, memberId: data.id, memberName: form.name,
          date: form.joinDate, amount: form.amountPaid, method: form.paymentMethod,
          plan: form.plan, recordedBy: recordedByName,
        }]);
        
        toast.success("Member added!");
        posthog.capture("member_added", { plan_type: form.plan, amount_paid: form.amountPaid });
      }
      setModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save member");
    } finally {
      setSaving(false);
    }
  };

  const markInactive = async (id: string) => {
    try {
      const { error } = await supabase.from("members" as any).update({ status: "Inactive" }).eq("id", id);
      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: "Inactive" } : m));
      toast.success("Member moved to Alumni");
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  const deleteMember = async (id: string) => {
    try {
      const { error } = await supabase.from("members" as any).delete().eq("id", id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== id));
      setDeleteConfirm(null);
      toast.success("Member deleted permanently");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete member");
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Phone", "Email", "Plan", "Total Fee", "Amount Paid", "Balance Due", "Join Date", "Expiry Date", "Attendance %", "Status"];
    const rows = members.map(m => [m.name, m.phone, m.email, m.plan, m.total_fee || 0, m.amountPaid, m.balance_due || 0, m.joinDate, m.expiryDate, m.attendance, m.status]);
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
      const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      
      const prompt = `You are a friendly, elite clinical sports nutritionist acting as a personal coach. 
      Create a highly personalized, warm, and human-sounding 1-day diet plan for ${member.name}.
      
      CLIENT STATS:
      Age: ${member.age} | Weight: ${member.weight} kg | Height: ${member.height} cm | Goal: ${dietGoal}
      
      INSTRUCTIONS & MATH:
      First, calculate and briefly state their BMI, estimated BMR, Target Daily Calories for their goal, and Macro split. Keep this math section friendly and easy to read.
      
      DIET PLAN FORMAT:
      Provide TWO 1-day meal plans (Option A: Vegetarian and Option B: Non-Vegetarian) that hit these exact macros.
      Give precise portion sizes (e.g., 150g chicken breast, 200g paneer) for Breakfast, Lunch, and Dinner.
      
      STYLE GUIDELINES (CRITICAL):
      1. Tone: Warm, human, and encouraging. Speak directly to ${member.name} like a supportive coach sending a WhatsApp message.
      2. Emojis: Use a few minimal, tasteful emojis (like 🥗, 💪, 💧) to make it feel personalized, but do not clutter the text.
      3. Formatting: Absolutely NO markdown formatting. Do NOT use asterisks (**) or hashes (#). Use standard spacing, line breaks, and ALL CAPS for headings to keep it looking clean and minimal.
      4. Length: Keep it concise, structured, and under 300 words.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are an expert clinical fitness nutritionist. You output precise math and structured diet plans." },
            { role: "user", content: prompt }
          ],
          temperature: 0.2 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "Failed to fetch from Groq");

      const aiDietText = data.choices[0].message.content;
      setDietPlan(aiDietText);
      posthog.capture("used_ai_diet_generator", { goal: dietGoal, member_name: member.name });
    } catch (err) {
      console.error("Groq AI Error:", err);
      toast.error("Failed to generate real diet plan");
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
    setSaving(true);
    const businessId = localStorage.getItem("business_id");
    
    if (!businessId) {
      toast.error("Business ID not found. Please log in again.");
      setSaving(false);
      return;
    }

    try {
      const paymentData = {
        member_id: selectedMember.id, member_name: selectedMember.name,
        date: new Date().toISOString().split("T")[0], amount: payForm.amount,
        method: payForm.method, plan: payForm.plan, recorded_by: recordedByName,
        note: payForm.note || null, business_id: businessId
      };
      
      const { data: rawPay, error } = await supabase.from("payments" as any).insert(paymentData).select().single();
      if (error) throw error;
      
      const newAmountPaid = selectedMember.amountPaid + payForm.amount;
      const totalFee = selectedMember.total_fee || selectedMember.amountPaid;
      const newBalanceDue = totalFee - newAmountPaid;

      const { error: memberError } = await supabase.from("members" as any).update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue < 0 ? 0 : newBalanceDue
      }).eq("id", selectedMember.id);
      
      if (memberError) throw memberError;

      const pd = rawPay as any;
      setPayments(prev => [...prev, { ...pd, id: pd.id }]);
      
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? { 
        ...m, amountPaid: newAmountPaid, balance_due: newBalanceDue < 0 ? 0 : newBalanceDue 
      } : m));
      
      setSelectedMember(prev => prev ? { 
        ...prev, amountPaid: newAmountPaid, balance_due: newBalanceDue < 0 ? 0 : newBalanceDue 
      } : null);

      setPaymentModal(false);
      posthog.capture("payment_recorded", { amount: payForm.amount, method: payForm.method, plan: payForm.plan });
      setPayForm({ amount: 1500, method: "UPI", plan: "Monthly", note: "" });
      toast.success("Payment recorded & Balance Updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const memberPayments = selectedMember ? payments.filter(p => p.memberId === selectedMember.id) : [];
  const attendanceThisMonth = useMemo(() => {
    const monthKey = new Date().toISOString().slice(0, 7);
    return memberAttendance.filter((a) => a.date.startsWith(monthKey));
  }, [memberAttendance]);
  const presentThisMonth = attendanceThisMonth.filter((a) => a.status === "Present").length;

  useEffect(() => {
    const fetchMemberAttendance = async () => {
      if (!selectedMember) {
        setMemberAttendance([]);
        return;
      }
      setAttendanceLoading(true);
      try {
        const { data, error } = await supabase
          .from("attendance" as any)
          .select("*")
          .eq("member_id", selectedMember.id)
          .order("date", { ascending: false });
        if (error) throw error;
        const mapped = (data || []).map((r: any) => ({
          id: r.id || `${r.member_id}-${r.date}`,
          date: String(r.date || ""),
          status: r.status || "Present",
        }));
        setMemberAttendance(mapped);
      } catch (err) {
        console.error("Failed to fetch member attendance:", err);
        setMemberAttendance([]);
      } finally {
        setAttendanceLoading(false);
      }
    };

    fetchMemberAttendance();
  }, [selectedMember]);

  const statusBadge = (s: string) => {
    if (s === "Active") return "bg-success/20 text-success";
    if (s === "Expired") return "bg-destructive/20 text-destructive";
    if (s === "Inactive") return "bg-muted text-muted-foreground";
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
        {!showInactive && (
          <>
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
              {["All", "Monthly", "Quarterly", "Annual"].map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="border border-border rounded-lg px-3 py-2 text-sm bg-card">
              {["All", "Active", "Expired", "Expiring Soon"].map(s => <option key={s}>{s}</option>)}
            </select>
          </>
        )}
        <Button onClick={() => setShowInactive(!showInactive)} variant="outline" className={`gap-2 ${showInactive ? "bg-muted" : ""}`}>
          <Archive className="h-4 w-4" /> {showInactive ? "Back to Active" : "View Alumni"}
        </Button>
        <Button onClick={openAdd} className="bg-accent hover:bg-accent/90 gap-2"><Plus className="h-4 w-4" /> Add Member</Button>
        <Button onClick={exportCSV} variant="outline" className="gap-2 hidden sm:flex"><Download className="h-4 w-4" /> Export</Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="bg-secondary">
            {["Name", "Phone", "Plan", "Total Fee", "Balance Due", "Expiry", "Attendance", "Status", "Actions"].map(h =>
              <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium whitespace-nowrap">{h}</th>
            )}
          </tr></thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t border-border hover:bg-secondary/30 cursor-pointer" onClick={() => { setSelectedMember(m); setDietPlan(""); }}>
                <td className="px-4 py-3 font-medium text-primary">{m.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                <td className="px-4 py-3">{m.plan}</td>
                <td className="px-4 py-3">₹{(m.total_fee || m.amountPaid).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 font-medium text-destructive">
                  {m.balance_due && m.balance_due > 0 ? `₹${m.balance_due.toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{m.expiryDate}</td>
                <td className="px-4 py-3">{m.attendance}%</td>
                <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(m.status)}`}>{m.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded hover:bg-secondary" title="Edit"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    {m.status !== "Inactive" && (
                      <button onClick={() => markInactive(m.id)} className="p-1.5 rounded hover:bg-yellow-100" title="Move to Alumni"><Archive className="h-3.5 w-3.5 text-yellow-700" /></button>
                    )}
                    <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Delete Permanently"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-primary mb-2">Delete Permanently?</h3>
            <p className="text-sm text-muted-foreground mb-4">This will erase all records of this member. We recommend using the "Archive" button instead.</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="destructive" onClick={() => deleteMember(deleteConfirm)}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
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
                <label className="text-xs font-medium text-muted-foreground">Plan Duration</label>
                <select 
                  value={form.plan} 
                  onChange={e => setForm(prev => ({ ...prev, plan: e.target.value as any }))}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                >
                  <option value="1">1 Month</option>
                  <option value="2">2 Months</option>
                  <option value="3">3 Months</option>
                  <option value="4">4 Months</option>
                  <option value="5">5 Months</option>
                  <option value="6">6 Months</option>
                  <option value="7">7 Months</option>
                  <option value="8">8 Months</option>
                  <option value="9">9 Months</option>
                  <option value="10">10 Months</option>
                  <option value="11">11 Months</option>
                  <option value="12">12 Months</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Join Date</label>
                <input type="date" value={form.joinDate} onChange={e => setForm(prev => ({ ...prev, joinDate: e.target.value }))}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
              </div>

              {/* Partial Payment Inputs */}
              <div className="col-span-2 border-t border-border my-2 pt-2">
                <p className="text-xs font-semibold text-primary mb-2">Payment Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Total Plan Fee (₹)</label>
                    <input type="number" value={form.total_fee} onChange={e => setForm(prev => ({ ...prev, total_fee: Number(e.target.value) }))}
                      className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Amount Paid Now (₹)</label>
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
                  {(form.total_fee || 0) > form.amountPaid && (
                    <div>
                      <label className="text-xs font-medium text-destructive">Next Due Date</label>
                      <input type="date" value={form.next_due_date} onChange={e => setForm(prev => ({ ...prev, next_due_date: e.target.value }))}
                        className="w-full mt-1 border border-destructive/50 rounded-lg px-3 py-2 text-sm bg-background" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full mt-4 bg-accent hover:bg-accent/90">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {editId ? "Update Member" : "Add Member"}
            </Button>
          </div>
        </div>
      )}

      {/* Selected Member Profile Modal (includes Diet Gen & Payment History) */}
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
                { label: "Status", value: selectedMember.status },
                { label: "Total Fee", value: `₹${(selectedMember.total_fee || selectedMember.amountPaid).toLocaleString()}` },
                { label: "Balance Due", value: selectedMember.balance_due && selectedMember.balance_due > 0 ? `₹${selectedMember.balance_due.toLocaleString()}` : "Clear" },
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

            {/* Attendance Visibility Block */}
            <div className="border border-border rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-primary text-sm mb-3">Attendance Details</h4>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Present This Month</p>
                  <p className="text-lg font-semibold text-primary">{presentThisMonth}</p>
                </div>
                <div className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Total Marked Records</p>
                  <p className="text-lg font-semibold text-primary">{memberAttendance.length}</p>
                </div>
              </div>
              {attendanceLoading ? (
                <p className="text-sm text-muted-foreground">Loading attendance...</p>
              ) : memberAttendance.length === 0 ? (
                <p className="text-sm text-muted-foreground">No attendance marked yet for this member.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary">
                        <th className="px-3 py-2 text-left text-muted-foreground">Date</th>
                        <th className="px-3 py-2 text-left text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {memberAttendance.slice(0, 20).map((a) => (
                        <tr key={a.id} className="border-t border-border">
                          <td className="px-3 py-2">{a.date}</td>
                          <td className="px-3 py-2">{a.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* AI Diet Plan Block */}
            <div className="border border-border rounded-xl p-4 mb-4">
              <h4 className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> AI Diet Plan Generator
              </h4>
              {hasGrowthFeatures ? (
                <>
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
                          <Copy className="h-3 w-3" /> Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => sendDietWhatsApp(selectedMember.phone)} className="gap-1 text-success border-success/30">
                          📱 Send on WhatsApp
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-secondary/50 rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-3">Generate AI-powered personalized diet plans for your members</p>
                  <p className="text-xs text-muted-foreground mb-4">Available on Growth plan (₹3,000/month)</p>
                  <Button size="sm" className="bg-accent hover:bg-accent/90" onClick={handleUpgradeClick}>
                    Upgrade to Growth
                  </Button>
                </div>
              )}
            </div>

            {/* Payment History Block */}
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

            {/* Add Payment Modal inside Selected Member Modal */}
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
                    {/* 🔥 Re-Added Plan Selector Here */}
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
                  <Button onClick={addPayment} disabled={saving} className="w-full mt-4 bg-accent hover:bg-accent/90">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Record & Update Balance
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}