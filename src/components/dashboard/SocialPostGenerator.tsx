import { useState } from "react";
import { Sparkles, Copy, Loader2, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

export default function SocialPostGenerator({
  postType, setPostType, platform, setPlatform, postContext, setPostContext,
  generatedPost, setGeneratedPost, postLoading, setPostLoading
}: Props) {

  const handleGenerate = async () => {
    setPostLoading(true);
    try {
      // 🔥 Calling the Groq AI API
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: "You are a world-class social media manager for Shapefit Gym in Naini, Prayagraj. You write catchy, high-energy posts that drive memberships."
            },
            {
              role: "user",
              content: `Write a ${platform} post for ${postType}. Context: ${postContext}. Include relevant emojis, 5 trending hashtags, and a call to action to visit us at Mama Bhanja Talab, Naini.`
            }
          ],
        }),
      });

      const data = await response.json();
      setGeneratedPost(data.choices[0].message.content);
      toast.success("Post generated!");
    } catch (error) {
      console.error(error);
      toast.error("AI failed to generate post.");
    } finally {
      setPostLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPost);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-accent" /> Campaign Details
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Post Type</label>
            <select value={postType} onChange={e => setPostType(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
              <option>Membership Offer</option>
              <option>New Equipment Alert</option>
              <option>Member Transformation</option>
              <option>Motivational Quote</option>
              <option>Holiday Special</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm">
              <option>Instagram</option>
              <option>Facebook</option>
              <option>WhatsApp Status</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Context (Optional)</label>
            <textarea value={postContext} onChange={e => setPostContext(e.target.value)} placeholder="e.g. 20% off for students this week only" className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm h-24 resize-none" />
          </div>
          <Button onClick={handleGenerate} disabled={postLoading} className="w-full bg-accent hover:bg-accent/90 gap-2">
            {postLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Generate Content
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">Generated Post</h3>
          {generatedPost && <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-8 gap-2"><Copy className="h-3.5 w-3.5" /> Copy</Button>}
        </div>
        <div className="flex-1 bg-secondary/30 rounded-lg p-4 text-sm font-mono whitespace-pre-wrap border border-dashed border-border min-h-[200px]">
          {generatedPost || "Your AI-generated post will appear here..."}
        </div>
      </div>
    </div>
  );
}