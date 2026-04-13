import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🔥 CHANGE YOUR LOGIN DETAILS HERE
    if (email === "shapefit1" && password === "bygrowsia") {
      localStorage.setItem("ironedge_auth", "true");
      navigate("/dashboard");
    } else {
      // Fixed the error message so it doesn't reveal your password!
      toast.error("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Dumbbell className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold text-primary">Owner Dashboard</h1>
          {/* Changed branding from IronEdge to ShapeFit */}
          <p className="text-sm text-muted-foreground mt-1">Sign in to manage ShapeFit</p>
        </div>
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-foreground">Email / Username</label>
            <input
              type="text" // Changed from email to text in case you just want a username
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 border border-border rounded-lg px-4 py-2.5 text-sm bg-background"
              placeholder="admin"
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
          <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
            <LogIn className="h-4 w-4" /> Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}