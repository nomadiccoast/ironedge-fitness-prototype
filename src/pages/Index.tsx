import { motion } from "framer-motion";
import { Sparkles, Calendar, TrendingUp, Headphones, Star, Users, Award, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const stats = [
  { icon: Users, value: "1,200+", label: "Members" },
  { icon: Award, value: "8", label: "Expert Trainers" },
  { icon: Star, value: "4.9★", label: "Google Rating" },
];

const features = [
  { icon: Calendar, title: "Smart Scheduling", desc: "AI-powered class timetable that adapts to your routine and preferences." },
  { icon: TrendingUp, title: "Progress Tracking", desc: "Monthly fitness reports with actionable insights on your performance." },
  { icon: Headphones, title: "24/7 AI Support", desc: "Get instant answers to your fitness questions, anytime." },
];

const testimonials = [
  { name: "Rahul Verma", quote: "Shapefit transformed my fitness journey. The AI scheduling saves so much time — best gym in Prayagraj!", rating: 5 },
  { name: "Priya Singh", quote: "Love the personal training sessions. The trainers are so knowledgeable and the vibe is always motivating.", rating: 5 },
  { name: "Amit Srivastava", quote: "The progress tracking feature is incredible. I can actually see my improvements month over month.", rating: 5 },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 800 400">
            {[...Array(20)].map((_, i) => (
              <circle key={i} cx={Math.random() * 800} cy={Math.random() * 400} r={Math.random() * 60 + 10} fill="white" opacity={0.1} />
            ))}
          </svg>
        </div>

        <div className="relative container py-20 md:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-6 border border-accent/30">
              <Sparkles className="h-4 w-4" /> AI-Powered Member Experience
            </span>
            <h1 className="text-4xl md:text-6xl font-display font-bold text-primary-foreground mb-6 max-w-3xl mx-auto leading-tight">
              Transform Your Body. Elevate Your Life.
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Prayagraj's most modern gym — expert trainers, smart scheduling, and a community that pushes you forward.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8">
                  Get Free Trial
                </Button>
              </Link>
              <Link to="/plans">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8">
                  View Plans
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-card border-b border-border">
        <div className="container py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 md:gap-16">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <s.icon className="h-6 w-6 text-accent" />
                <div>
                  <p className="text-xl font-bold text-primary">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="container py-16 md:py-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary mb-4">
              Not just a gym. A complete fitness ecosystem.
            </h2>
            <p className="text-muted-foreground mb-8">
              We combine world-class equipment with AI-driven insights to deliver a gym experience unlike anything in Prayagraj.
            </p>
            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.title} className="flex gap-4 p-4 rounded-xl bg-card border border-border shadow-sm">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <f.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden md:grid grid-cols-2 gap-4">
            {[BarChart3, Calendar, TrendingUp, Headphones].map((Icon, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
                <Icon className="h-12 w-12 text-accent/60" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-secondary/50 py-16 md:py-24">
        <div className="container">
          <h2 className="text-3xl font-display font-bold text-primary text-center mb-12">
            What Our Members Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-card p-6 rounded-xl shadow-sm border border-border"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{t.name}</p>
                    <div className="flex gap-0.5">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-accent text-accent" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">"{t.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Google Maps */}
      <section className="container py-16 md:py-24">
        <h2 className="text-3xl font-display font-bold text-primary text-center mb-2">Find Us</h2>
        <p className="text-muted-foreground text-center mb-8">Naini, Prayagraj</p>
       <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
          <iframe
            src="https://maps.google.com/maps?q=Mama+bhanja+talab,+Rewa+Rd,+Naini,+Prayagraj&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="w-full h-64 md:h-80"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Shapefit Fitness Location"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-center">
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="font-semibold text-primary">📍 Address</p>
            <p className="text-sm text-muted-foreground">Mama bhanja talab, Rewa Rd, Naini, Prayagraj, UP 212111</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="font-semibold text-primary">📞 Phone</p>
            <p className="text-sm text-muted-foreground">+91 8181838352</p>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <p className="font-semibold text-primary">📧 Email</p>
            <p className="text-sm text-muted-foreground">info@growisa.in</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}