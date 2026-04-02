import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dumbbell, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Updated credentials as per your request
    if (userId === "shapefit_99" && password === "growsia11") {
      localStorage.setItem("ironedge_auth", "true");
      navigate("/dashboard");
    } else {
      toast.error("Invalid ID or password. Access Denied.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Dumbbell className="h-10 w-10 text-accent mx-auto mb-3" />
          <h1 className="text-2xl font-display font-bold text-primary">ShapeFit Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Gym and Dance Centre Portal</p>
        </div>
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <div>
            <label className="text-sm font-medium text-foreground">Admin ID</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full mt-1 border border-border rounded-lg px-4 py-2.5 text-sm bg-background"
              placeholder="shapefit_99"
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
            <LogIn className="h-4 w-4" /> Sign In to ShapeFit
          </Button>
        </form>
      </div>
    </div>
  );
}