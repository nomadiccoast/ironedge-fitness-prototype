import { useMemo, useState } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Expense } from "@/data/members";

interface Props {
  expenses: Expense[];
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
}

const COMMON_CATEGORIES = [
  "Rent",
  "Salaries",
  "Utilities",
  "Equipment Maintenance",
  "Marketing",
  "Software/Subscriptions",
  "Cleaning",
  "Internet/Phone",
  "Miscellaneous",
  "Other",
];

const PAYMENT_METHODS: Expense["paymentMethod"][] = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

export default function ExpensesManagement({ expenses, setExpenses }: Props) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(COMMON_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<Expense["paymentMethod"]>("UPI");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const totals = useMemo(() => {
    const now = new Date();
    const ym = now.toISOString().slice(0, 7);
    const monthTotal = expenses
      .filter((e) => String(e.date || "").startsWith(ym))
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const allTimeTotal = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return { monthTotal, allTimeTotal };
  }, [expenses]);

  const addExpense = async () => {
    const businessId = localStorage.getItem("business_id");
    if (!businessId) {
      toast.error("Business ID not found. Please log in again.");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }
    if (category === "Other" && !customCategory.trim()) {
      toast.error("Please enter custom expense name for Other.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        business_id: businessId,
        date,
        category,
        custom_category: category === "Other" ? customCategory.trim() : null,
        amount,
        payment_method: paymentMethod,
        note: note.trim() || null,
      };
      const { data, error } = await supabase.from("expenses" as any).insert(payload).select().single();
      if (error) throw error;

      setExpenses((prev) => [
        {
          id: data.id,
          businessId: data.business_id,
          date: data.date,
          category: data.category,
          customCategory: data.custom_category,
          amount: Number(data.amount),
          paymentMethod: data.payment_method,
          note: data.note,
          createdAt: data.created_at,
        },
        ...prev,
      ]);

      setAmount(0);
      setCategory(COMMON_CATEGORIES[0]);
      setCustomCategory("");
      setNote("");
      toast.success("Expense added.");
    } catch (err) {
      console.error("Expense insert error:", err);
      toast.error("Could not add expense.");
    } finally {
      setSaving(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase.from("expenses" as any).delete().eq("id", id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      toast.success("Expense deleted.");
    } catch (err) {
      console.error("Expense delete error:", err);
      toast.error("Could not delete expense.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Expenses This Month</p>
          <p className="text-2xl font-bold text-primary">Rs {totals.monthTotal.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-sm text-muted-foreground">All-time Expenses</p>
          <p className="text-2xl font-bold text-primary">Rs {totals.allTimeTotal.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <Wallet className="h-5 w-5 text-accent" /> Add Expense
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
              {COMMON_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {category === "Other" && (
            <div>
              <label className="text-xs text-muted-foreground">Custom Expense Name</label>
              <input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="e.g. Local Event Sponsorship" className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
            </div>
          )}
          <div>
            <label className="text-xs text-muted-foreground">Amount (Rs)</label>
            <input type="number" min={0} value={amount || ""} onChange={(e) => setAmount(Number(e.target.value || 0))} className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Payment Method</label>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as Expense["paymentMethod"])} className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
              {PAYMENT_METHODS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="text-xs text-muted-foreground">Note (optional)</label>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. April electricity bill" className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
          </div>
        </div>
        <Button onClick={addExpense} disabled={saving} className="bg-accent hover:bg-accent/90 gap-2">
          <Plus className="h-4 w-4" /> {saving ? "Saving..." : "Add Expense"}
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              {["Date", "Category", "Amount", "Method", "Note", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No expenses added yet.</td></tr>
            ) : (
              expenses.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">{e.date}</td>
                  <td className="px-4 py-3">{e.category === "Other" ? e.customCategory || "Other" : e.category}</td>
                  <td className="px-4 py-3 font-medium">Rs {Number(e.amount).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.paymentMethod}</td>
                  <td className="px-4 py-3 text-muted-foreground">{e.note || "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteExpense(e.id)} className="p-1.5 rounded hover:bg-destructive/10" title="Delete expense">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
