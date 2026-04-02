import { useState } from "react";
import { Sparkles, Copy, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  postType: string;
  setPostType: (v: string) => void;
  platform: string;
  setPlatform: (v: string) => void;
  postContext: string;
  setPostContext: (v: string) => void;
  generatedPost: string;
  setGeneratedPost: (v: string) => void;
  postLoading: boolean;
  setPostLoading: (v: boolean) => void;
}

const BROADCAST_TYPES = [
  "Membership Offer",
  "Motivational Check-in",
  "Festival Greeting",
  "Renewal Reminder (Bulk)",
];

export default function SocialPostGenerator(props: Props) {
  const { postType, setPostType, platform, setPlatform, postContext, setPostContext, generatedPost, setGeneratedPost, postLoading, setPostLoading } = props;
  const [activeTab, setActiveTab] = useState<"social" | "broadcast">("social");
  const [broadcastType, setBroadcastType] = useState(BROADCAST_TYPES[0]);
  const [broadcastDate, setBroadcastDate] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const generatePost = async () => {
    setPostLoading(true);
    setGeneratedPost("");
    try {
      const { data, error } = await supabase.functions.invoke("ai-social", {
        body: { postType, platform, context: postContext },
      });
      if (error) throw error;
      setGeneratedPost(data.content);
    } catch {
      toast.error("Failed to generate post");
    } finally {
      setPostLoading(false);
    }
  };

  const generateBroadcast = async () => {
    setBroadcastLoading(true);
    setBroadcastMsg("");
    try {
      const extra = broadcastType === "Festival Greeting" && broadcastDate ? ` The occasion is on ${broadcastDate}.` : "";
      const { data, error } = await supabase.functions.invoke("ai-social", {
        body: { postType: `WhatsApp Broadcast - ${broadcastType}`, platform: "WhatsApp", context: `Generate a gym WhatsApp broadcast message. Type: ${broadcastType}.${extra} Keep it Hinglish, gym-appropriate, motivational.` },
      });
      if (error) throw error;
      setBroadcastMsg(data.content);
    } catch {
      toast.error("Failed to generate broadcast");
    } finally {
      setBroadcastLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        {(["social", "broadcast"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
            {tab === "social" ? "Social Posts" : "WhatsApp Broadcast"}
          </button>
        ))}
      </div>

      {activeTab === "social" ? (
        <>
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-accent" /> Social Post Generator
            </h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground">Post Type</label>
                <select value={postType} onChange={e => setPostType(e.target.value)}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
                  {["Membership Offer", "Motivational Post", "Class Announcement", "Trainer Spotlight", "Festival Wish"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Platform</label>
                <div className="flex gap-2 mt-1">
                  {["Instagram", "Facebook", "WhatsApp Status"].map(p => (
                    <button key={p} onClick={() => setPlatform(p)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${platform === p ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <textarea value={postContext} onChange={e => setPostContext(e.target.value)}
              placeholder="Additional context (optional)" className="w-full border border-border rounded-lg px-4 py-2.5 text-sm bg-background resize-none mb-4" rows={2} />
            <Button onClick={generatePost} disabled={postLoading} className="bg-accent hover:bg-accent/90 gap-2">
              {postLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Post
            </Button>
          </div>

          {postLoading && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-4 bg-secondary rounded animate-pulse" style={{ width: `${85 - i * 15}%` }} />)}</div>
            </div>
          )}

          {generatedPost && (
            <div className={`rounded-xl p-6 border ${platform === "WhatsApp Status" ? "bg-success/5 border-success/20" : platform === "Instagram" ? "bg-purple-50 border-purple-200" : "bg-blue-50 border-blue-200"}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">{platform} Preview</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedPost); toast.success("Copied!"); }} className="gap-1">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={generatePost}>Regenerate</Button>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{generatedPost}</p>
            </div>
          )}
        </>
      ) : (
        /* WhatsApp Broadcast */
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-primary mb-4">📱 WhatsApp Broadcast Generator</h3>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-foreground">Message Type</label>
                <select value={broadcastType} onChange={e => setBroadcastType(e.target.value)}
                  className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
                  {BROADCAST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {broadcastType === "Festival Greeting" && (
                <div>
                  <label className="text-sm font-medium text-foreground">Festival / Occasion Date</label>
                  <input type="date" value={broadcastDate} onChange={e => setBroadcastDate(e.target.value)}
                    className="w-full mt-1 border border-border rounded-lg px-3 py-2 text-sm bg-background" />
                </div>
              )}
            </div>
            <Button onClick={generateBroadcast} disabled={broadcastLoading} className="bg-accent hover:bg-accent/90 gap-2">
              {broadcastLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate Broadcast
            </Button>
          </div>

          {broadcastLoading && (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-4 bg-secondary rounded animate-pulse" style={{ width: `${85 - i * 15}%` }} />)}</div>
            </div>
          )}

          {broadcastMsg && (
            <div className="bg-success/5 border border-success/20 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground">WhatsApp Broadcast Preview</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(broadcastMsg); toast.success("Copied!"); }} className="gap-1">
                    <Copy className="h-3 w-3" /> Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(broadcastMsg)}`, "_blank")} className="gap-1 text-success border-success/30">
                    📱 Send on WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={generateBroadcast}>Regenerate</Button>
                </div>
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{broadcastMsg}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
