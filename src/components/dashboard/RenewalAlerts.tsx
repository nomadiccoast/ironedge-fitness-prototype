import type { Member } from "@/data/members";

interface Props {
  members: Member[];
  gymPhone?: string;
}

export default function RenewalAlerts({ members, gymPhone }: Props) {
  const gymName = localStorage.getItem("gym_name") || "My Gym";
  
  const expiringSoon = members.filter(m => {
    const diff = (new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  }).map(m => {
    const daysLeft = Math.ceil((new Date(m.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return { ...m, daysLeft };
  });

  const sendReminder = (m: typeof expiringSoon[0]) => {
    const phoneText = gymPhone ? `Call us at ${gymPhone}` : `Please contact ${gymName} support for renewal`;
    const msg = encodeURIComponent(`Hey ${m.name}! Your ${gymName} membership expires in ${m.daysLeft} days. Renew now to keep your streak going 💪 ${phoneText}`);
    window.open(`https://wa.me/91${m.phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-primary text-sm mb-3 flex items-center gap-2">
        🔔 Renewal Alerts — Next 7 Days
      </h3>
      {expiringSoon.length === 0 ? (
        <p className="text-sm text-muted-foreground">No renewals due this week 🎉</p>
      ) : (
        <div className="space-y-2">
          {expiringSoon.map(m => (
            <div key={m.id} className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <div>
                <p className="text-sm font-medium text-primary">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.phone} · {m.plan} · <span className="text-yellow-700 font-medium">{m.daysLeft} days left</span></p>
              </div>
              <button onClick={() => sendReminder(m)}
                className="text-xs font-medium bg-success/20 text-success px-3 py-1.5 rounded-lg hover:bg-success/30 transition-colors whitespace-nowrap">
                📱 Send Reminder
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
