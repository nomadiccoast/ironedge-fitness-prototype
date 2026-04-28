import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client"; // ⚠️ Adjust this import path if your supabase client is somewhere else (like "@/lib/supabase")

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate inputs
  if (!email || !password) {
    toast.error("Please fill in all fields");
    return;
  }

  setLoading(true);
  
  try {
    // 1. Verify email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      toast.error(authError.message);
      return;
    }

    if (authData.user) {
      // 2. Look up their business
      const { data: businessData, error: bizError } = await supabase
        .from('business_accounts')
        .select('id, gym_name, owner, "phone no."')
        .eq('owner_id', authData.user.id)
        .single();

      if (bizError || !businessData) {
        toast.error("No business account found for this user.");
        return;
      }

      // 3. Save to localStorage
      localStorage.setItem("Shapefit_auth", "true"); 
      localStorage.setItem("business_id", businessData.id); 
      localStorage.setItem("gym_name", businessData.gym_name);
      localStorage.setItem("owner_name", businessData.owner || "");
      localStorage.setItem("gym_phone", businessData["phone no."] || "");
      localStorage.setItem("user_email", authData.user.email || email);

      toast.success(`Welcome to ${businessData.gym_name}!`);
      navigate("/dashboard");
    }
  } catch (error) {
    toast.error("An unexpected error occurred");
    console.error(error);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Dumbbell className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold text-primary">Owner Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage your Gym</p>
        </div>
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email" // Changed to 'email' because Supabase requires real email addresses
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-border rounded-lg px-4 py-2.5 text-sm bg-background"
              placeholder="admin@fitnessfirst.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 border border-border rounded-lg px-4 py-2.5 text-sm bg-background"
              placeholder="••••••••"
              required
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading} // Prevents them from clicking twice while it loads
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <LogIn className="h-4 w-4" /> 
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}