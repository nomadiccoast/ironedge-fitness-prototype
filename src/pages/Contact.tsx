import { useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const slots = [
  { day: "Mon", times: ["10:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"] },
  { day: "Tue", times: ["10:00 AM", "1:00 PM", "3:00 PM", "5:00 PM"] },
  { day: "Wed", times: ["11:00 AM", "2:00 PM", "4:00 PM"] },
  { day: "Thu", times: ["10:00 AM", "12:00 PM", "3:00 PM", "5:00 PM"] },
  { day: "Fri", times: ["10:00 AM", "1:00 PM", "4:00 PM"] },
];
const booked = ["Tue-1:00 PM", "Wed-2:00 PM", "Thu-12:00 PM", "Fri-1:00 PM"];

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [slotModal, setSlotModal] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success("Thanks! We'll reach out within 24 hours. 🙌");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left */}
          <div>
            <h1 className="text-4xl font-display font-bold text-primary mb-3">Let's Build Your Gym's Website</h1>
            <p className="text-muted-foreground mb-8">
              We're growisa — we build AI-powered websites for gyms across India. Fill in the form and we'll get back within 24 hours.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { icon: MapPin, text: "Civil Lines, Prayagraj, UP" },
                { icon: Phone, text: "+91 98765 43210" },
                { icon: Mail, text: "hello@growisa.in" },
                { icon: Clock, text: "Response within 24 hours" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-foreground">
                  <item.icon className="h-5 w-5 text-accent" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <a href="https://wa.me/919876543210" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-whatsapp hover:bg-whatsapp/90 text-white gap-2 w-full md:w-auto">
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-3">Prefer a quick call? Book a 15-min slot below.</p>
          </div>

          {/* Right - Form */}
          <div>
            {submitted ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-display font-bold text-primary">Enquiry Sent!</h3>
                <p className="text-muted-foreground mt-2">We'll reach out within 24 hours. 🙌</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
                <input required placeholder="Full Name" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                <input required placeholder="Gym Name" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                <div className="grid grid-cols-2 gap-4">
                  <input required placeholder="City" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                  <input required placeholder="Phone Number" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                </div>
                <input required type="email" placeholder="Email" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                <textarea rows={3} placeholder="Tell us about your gym" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background resize-none" />
                <select className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background text-muted-foreground">
                  <option>How did you hear about us?</option>
                  <option>Instagram</option>
                  <option>Google</option>
                  <option>WhatsApp</option>
                  <option>Referral</option>
                  <option>Other</option>
                </select>
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Send Enquiry — Free Consultation
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Booking */}
      <section className="container py-16">
        <h2 className="text-2xl font-display font-bold text-primary text-center mb-2">Or book a free 15-min call directly</h2>
        <p className="text-muted-foreground text-center mb-8">Pick a slot that works for you</p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {slots.map((day) => (
            <div key={day.day} className="space-y-2">
              <h4 className="font-semibold text-primary text-center text-sm">{day.day}</h4>
              {day.times.map((time) => {
                const isBooked = booked.includes(`${day.day}-${time}`);
                return (
                  <button
                    key={time}
                    disabled={isBooked}
                    onClick={() => setSlotModal(`${day.day} at ${time}`)}
                    className={`w-full text-xs py-2 rounded-lg font-medium transition-colors ${
                      isBooked
                        ? "bg-muted text-muted-foreground cursor-not-allowed"
                        : "bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Slot confirmation */}
      <Dialog open={!!slotModal} onOpenChange={() => setSlotModal(null)}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle className="font-display">Slot Booked!</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="h-14 w-14 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-7 w-7 text-success" />
            </div>
            <p className="text-foreground font-medium">{slotModal}</p>
            <p className="text-sm text-muted-foreground mt-2">You'll receive a confirmation on WhatsApp.</p>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
