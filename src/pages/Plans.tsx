import { useState } from "react";
import { Check, X as XIcon, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const periods = ["Monthly", "Quarterly", "Annual"] as const;
const multipliers = { Monthly: 1, Quarterly: 2.7, Annual: 9.5 };

const plans = [
  {
    name: "BASIC", price: 999, popular: false,
    features: ["6-day gym access", "Locker facility", "Basic fitness assessment"],
    missing: ["PT sessions", "Diet consultation", "AI progress reports"],
  },
  {
    name: "PRO", price: 1799, popular: true,
    features: ["Unlimited gym access", "2 PT sessions/month", "Diet consultation", "AI progress reports"],
    missing: ["Unlimited PT", "Nutrition plan"],
  },
  {
    name: "ELITE", price: 2999, popular: false,
    features: ["All PRO features", "Unlimited PT sessions", "Nutrition plan", "Priority class booking", "Dedicated trainer"],
    missing: [],
  },
];

const services = [
  { title: "Personal Training", desc: "One-on-one sessions with certified trainers tailored to your fitness goals.", icon: "🏋️" },
  { title: "Group Classes", desc: "Zumba, HIIT, Yoga — energizing group sessions for all fitness levels.", icon: "👥" },
  { title: "Nutrition Counseling", desc: "Personalized diet plans crafted by expert nutritionists for optimal results.", icon: "🥗" },
  { title: "Physiotherapy Sessions", desc: "Recover faster with professional physiotherapy and rehab support.", icon: "💆" },
];

const timetable = [
  { time: "6:00 AM", mon: "Yoga", tue: "HIIT", wed: "Yoga", thu: "HIIT", fri: "Yoga", sat: "Zumba", sun: "Open Gym" },
  { time: "8:00 AM", mon: "Open Gym", tue: "Zumba", wed: "Open Gym", thu: "Zumba", fri: "Open Gym", sat: "HIIT", sun: "Open Gym" },
  { time: "10:00 AM", mon: "HIIT", tue: "Open Gym", wed: "HIIT", thu: "Open Gym", fri: "HIIT", sat: "Yoga", sun: "—" },
  { time: "4:00 PM", mon: "Zumba", tue: "Yoga", wed: "Zumba", thu: "Yoga", fri: "Zumba", sat: "Open Gym", sun: "—" },
  { time: "6:00 PM", mon: "Open Gym", tue: "HIIT", wed: "Open Gym", thu: "HIIT", fri: "Open Gym", sat: "Open Gym", sun: "—" },
  { time: "8:00 PM", mon: "Yoga", tue: "Open Gym", wed: "Yoga", thu: "Open Gym", fri: "Yoga", sat: "—", sun: "—" },
];

const classColors: Record<string, string> = {
  Yoga: "bg-success/20 text-success",
  HIIT: "bg-accent/20 text-accent",
  Zumba: "bg-purple-100 text-purple-700",
  "Open Gym": "bg-muted text-muted-foreground",
};

export default function Plans() {
  const [period, setPeriod] = useState<typeof periods[number]>("Monthly");
  const [modal, setModal] = useState<null | typeof plans[0]>(null);

  const getPrice = (base: number) => Math.round(base * multipliers[period]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="container py-16 text-center">
        <h1 className="text-4xl font-display font-bold text-primary mb-2">Hamare Plans</h1>
        <p className="text-muted-foreground text-lg mb-8">Choose What Fits You</p>

        {/* Toggle */}
        <div className="inline-flex bg-secondary rounded-full p-1 gap-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                period === p ? "bg-accent text-accent-foreground shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container pb-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-card rounded-2xl border p-6 flex flex-col ${
                plan.popular ? "border-accent shadow-lg scale-105 z-10" : "border-border shadow-sm"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Most Popular
                </span>
              )}
              <h3 className="font-display font-bold text-lg text-primary">{plan.name}</h3>
              <div className="mt-4 mb-6">
                <span className="text-4xl font-bold text-primary">₹{getPrice(plan.price).toLocaleString("en-IN")}</span>
                <span className="text-muted-foreground text-sm">/{period.toLowerCase()}</span>
              </div>
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0" /> {f}
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <XIcon className="h-4 w-4 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setModal(plan)}
                className={`mt-6 w-full ${plan.popular ? "bg-accent hover:bg-accent/90" : ""}`}
                variant={plan.popular ? "default" : "outline"}
              >
                Abhi Join Karein
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Razorpay Modal */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Complete Payment</DialogTitle>
          </DialogHeader>
          {modal && (
            <div className="space-y-4">
              <div className="bg-secondary p-4 rounded-xl">
                <p className="font-semibold text-primary">{modal.name} Plan</p>
                <p className="text-2xl font-bold text-primary">₹{getPrice(modal.price).toLocaleString("en-IN")}</p>
              </div>
              <input placeholder="Full Name" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-card" />
              <input placeholder="Phone Number" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-card" />
              <input placeholder="Email" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-card" />
              <div className="flex gap-2 border-b border-border pb-2">
                {["UPI", "Card", "Net Banking"].map((tab) => (
                  <button key={tab} className="px-3 py-1.5 text-xs rounded-md bg-secondary text-muted-foreground">{tab}</button>
                ))}
              </div>
              <Button className="w-full bg-razorpay hover:bg-razorpay/90 text-white font-semibold">
                Pay with Razorpay
              </Button>
              <p className="text-xs text-muted-foreground text-center">🔒 Secure payment powered by Razorpay</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Services */}
      <section className="container py-16">
        <h2 className="text-3xl font-display font-bold text-primary text-center mb-10">Our Services</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {services.map((s) => (
            <div key={s.title} className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <span className="text-3xl">{s.icon}</span>
              <h3 className="font-semibold text-primary mt-3">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              <button className="text-accent text-sm font-medium mt-3 hover:underline">Know More →</button>
            </div>
          ))}
        </div>
      </section>

      {/* Timetable */}
      <section className="container py-16">
        <h2 className="text-3xl font-display font-bold text-primary text-center mb-10">Class Timetable</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="px-4 py-3 text-left">Time</th>
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <th key={d} className="px-4 py-3 text-center">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetable.map((row) => (
                <tr key={row.time} className="border-t border-border">
                  <td className="px-4 py-3 font-medium text-primary">{row.time}</td>
                  {["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((day) => {
                    const cls = (row as any)[day] as string;
                    return (
                      <td key={day} className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-medium ${classColors[cls] || ""}`}>
                          {cls}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Footer />
    </div>
  );
}
