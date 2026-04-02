import { useState, useMemo } from "react";
import type { Member, AttendanceRecord } from "@/data/members";

interface Props {
  members: Member[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
}

export default function AttendanceTracker({ members, attendance, setAttendance }: Props) {
  const today = new Date();
  const [year] = useState(today.getFullYear());
  const [month] = useState(today.getMonth());
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const todayStr = today.toISOString().split("T")[0];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const monthName = new Date(year, month).toLocaleString("en-IN", { month: "long", year: "numeric" });

  const dayCheckins = useMemo(() => {
    const map: Record<string, number> = {};
    attendance.forEach(a => {
      const d = a.date;
      if (d.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
        map[d] = (map[d] || 0) + 1;
      }
    });
    return map;
  }, [attendance, year, month]);

  const topMembers = useMemo(() => {
    const counts: Record<string, { name: string; count: number }> = {};
    attendance.forEach(a => {
      if (a.date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
        if (!counts[a.memberId]) counts[a.memberId] = { name: a.memberName, count: 0 };
        counts[a.memberId].count++;
      }
    });
    return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [attendance, year, month]);

  const zeroThisWeek = useMemo(() => {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    const weekStartStr = weekStart.toISOString().split("T")[0];
    const memberIds = new Set(attendance.filter(a => a.date >= weekStartStr).map(a => a.memberId));
    return members.filter(m => m.status !== "Expired" && !memberIds.has(m.id));
  }, [members, attendance, today]);

  const markAttendance = () => {
    if (!selectedMemberId) return;
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;
    const exists = attendance.some(a => a.memberId === selectedMemberId && a.date === todayStr);
    if (exists) return;
    setAttendance(prev => [...prev, { memberId: selectedMemberId, memberName: member.name, date: todayStr }]);
    setSelectedMemberId("");
  };

  const maxCheckins = Math.max(...Object.values(dayCheckins), 1);

  return (
    <div className="space-y-6">
      {/* Mark attendance */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="font-semibold text-primary text-sm mb-3">Mark Today's Attendance</h3>
        <div className="flex gap-3">
          <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)}
            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background">
            <option value="">Select member...</option>
            {members.filter(m => m.status !== "Expired").map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button onClick={markAttendance} disabled={!selectedMemberId}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-accent text-accent-foreground disabled:opacity-50 hover:bg-accent/90 transition-colors">
            Mark Present
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-4">
          <h3 className="font-semibold text-primary text-sm mb-3">{monthName}</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-1 text-muted-foreground font-medium">{d}</div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const count = dayCheckins[dateStr] || 0;
              const isToday = dateStr === todayStr;
              const intensity = count > 0 ? Math.min(count / maxCheckins, 1) : 0;
              return (
                <div key={day} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${isToday ? "ring-2 ring-accent" : ""}`}
                  style={{ backgroundColor: count > 0 ? `hsl(351 79% 59% / ${0.15 + intensity * 0.5})` : undefined }}>
                  <span className={`font-medium ${isToday ? "text-accent" : "text-primary"}`}>{day}</span>
                  {count > 0 && <span className="text-[10px] text-muted-foreground">{count}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side cards */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="font-semibold text-primary text-sm mb-3">🏆 Top 5 Most Regular</h4>
            {topMembers.length === 0 ? <p className="text-xs text-muted-foreground">No data yet</p> : (
              <div className="space-y-2">
                {topMembers.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{i + 1}. {m.name}</span>
                    <span className="text-xs font-medium bg-success/20 text-success px-2 py-0.5 rounded-full">{m.count} days</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            <h4 className="font-semibold text-primary text-sm mb-3">⚠️ 0 Check-ins This Week</h4>
            {zeroThisWeek.length === 0 ? (
              <p className="text-xs text-success">All active members checked in! 💪</p>
            ) : (
              <div className="space-y-1.5">
                {zeroThisWeek.map(m => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{m.name}</span>
                    <span className="text-xs text-destructive">{m.plan}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
