import { useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client"; // ✅ Imported Supabase

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
  const [loading, setLoading] = useState(false); // ✅ Track loading state

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Create a special object to grab form data
    const formData = new FormData(e.currentTarget);
    
    const leadData = {
      name: formData.get("fullname"),
      gym_name: formData.get("gymname"),
      city: formData.get("city"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      status: "New",
    };

    try {
      // ✅ Send data to the NEW leads table
      const { error } = await supabase.from("leads").insert([leadData]);
      if (error) throw error;

      setSubmitted(true);
      toast.success("Enquiry sent successfully! 🙌");
    } catch (err: any) {
      console.error("Supabase Lead Error:", err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="container py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Left Side Content */}
          <div>
            <h1 className="text-4xl font-display font-bold text-primary mb-3">Let's Build Your Gym's Website</h1>
            <p className="text-muted-foreground mb-8">
              We're growisa — we build AI-powered websites for gyms across India. Fill in the form and we'll get back within 24 hours.
            </p>
            <div className="space-y-4 mb-8">
              {[
                { icon: MapPin, text: "Mama bhanja talab ,Rewa Rd, Naini, Prayagraj, Uttar Pradesh 212111" },
                { icon: Phone, text: "+91 8181838352" },
                { icon: Mail, text: "info@growisa.in" },
                { icon: Clock, text: "Response within 24 hours" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 text-foreground">
                  <item.icon className="h-5 w-5 text-accent" />
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>
            <a href="https://wa.me/918181838352" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-whatsapp hover:bg-whatsapp/90 text-white gap-2 w-full md:w-auto">
                <MessageCircle className="h-5 w-5" /> Chat on WhatsApp
              </Button>
            </a>
          </div>

          {/* Right Side Form */}
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
                {/* ✅ Added 'name' attributes so the code knows which input is which */}
                <input name="fullname" required placeholder="Full Name" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                <input name="gymname" required placeholder="Gym Name" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                <div className="grid grid-cols-2 gap-4">
                  <input name="city" required placeholder="City" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                  <input name="phone" required placeholder="Phone Number" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                </div>
                <input name="email" required type="email" placeholder="Email" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background" />
                <textarea name="message" rows={3} placeholder="Tell us about your gym" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background resize-none" />
                
                <Button type="submit" disabled={loading} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  {loading ? "Sending..." : "Send Enquiry — Free Consultation"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="container pb-16">
        <h2 className="text-2xl font-display font-bold text-primary text-center mb-6">Our Location</h2>
        <div className="rounded-2xl overflow-hidden shadow-lg border border-border">
          <iframe
            src="https://maps.google.com/maps?q=Mama+bhanja+talab,+Rewa+Rd,+Naini,+Prayagraj&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="w-full h-64 md:h-80"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Growisa Office Location"
          />
        </div>
      </section>

      {/* Booking and Dialog Code remains the same... */}
      <Footer />
    </div>
  );
}