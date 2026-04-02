export interface Member {
  id: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  weight: number;
  height: number;
  plan: "Monthly" | "Quarterly" | "Annual";
  amountPaid: number;
  paymentMethod: "Cash" | "UPI" | "Card";
  joinDate: string;
  expiryDate: string;
  attendance: number;
  status: "Active" | "Expired" | "Expiring Soon";
}

export interface Payment {
  id: string;
  memberId: string;
  memberName: string;
  date: string;
  amount: number;
  method: "Cash" | "UPI" | "Card";
  plan: "Monthly" | "Quarterly" | "Annual";
  recordedBy: string;
  note?: string;
}

export interface AttendanceRecord {
  memberId: string;
  memberName: string;
  date: string; // YYYY-MM-DD
}

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function fmt(d: Date): string {
  return d.toISOString().split("T")[0];
}

const today = new Date();

export const initialMembers: Member[] = [
  { id: "1", name: "Rahul Verma", phone: "9876543210", email: "rahul@gmail.com", age: 25, weight: 78, height: 175, plan: "Quarterly", amountPaid: 4500, paymentMethod: "UPI", joinDate: "2025-01-10", expiryDate: addDays(today, 5), attendance: 82, status: "Expiring Soon" },
  { id: "2", name: "Priya Singh", phone: "9123456789", email: "priya@gmail.com", age: 23, weight: 58, height: 160, plan: "Annual", amountPaid: 12000, paymentMethod: "Card", joinDate: "2025-06-01", expiryDate: "2026-06-01", attendance: 91, status: "Active" },
  { id: "3", name: "Amit Srivastava", phone: "9765432100", email: "amit@gmail.com", age: 30, weight: 85, height: 178, plan: "Monthly", amountPaid: 1500, paymentMethod: "Cash", joinDate: "2026-02-15", expiryDate: addDays(today, -3), attendance: 45, status: "Expired" },
  { id: "4", name: "Sneha Yadav", phone: "9345678901", email: "sneha@gmail.com", age: 27, weight: 62, height: 165, plan: "Quarterly", amountPaid: 4500, paymentMethod: "UPI", joinDate: "2026-01-01", expiryDate: "2026-04-01", attendance: 76, status: "Active" },
  { id: "5", name: "Deepak Tiwari", phone: "9987654321", email: "deepak@gmail.com", age: 28, weight: 90, height: 180, plan: "Annual", amountPaid: 12000, paymentMethod: "Card", joinDate: "2025-09-01", expiryDate: "2026-09-01", attendance: 88, status: "Active" },
  { id: "6", name: "Kavita Rani", phone: "9012345678", email: "kavita@gmail.com", age: 22, weight: 55, height: 158, plan: "Monthly", amountPaid: 1500, paymentMethod: "UPI", joinDate: "2026-03-01", expiryDate: addDays(today, 3), attendance: 70, status: "Expiring Soon" },
  { id: "7", name: "Vikas Pandey", phone: "9801234567", email: "vikas@gmail.com", age: 35, weight: 95, height: 182, plan: "Quarterly", amountPaid: 4500, paymentMethod: "Cash", joinDate: "2026-01-15", expiryDate: "2026-04-15", attendance: 60, status: "Active" },
  { id: "8", name: "Nisha Agarwal", phone: "9701234567", email: "nisha@gmail.com", age: 26, weight: 60, height: 162, plan: "Annual", amountPaid: 12000, paymentMethod: "UPI", joinDate: "2025-12-01", expiryDate: "2026-12-01", attendance: 95, status: "Active" },
  { id: "9", name: "Sanjay Patel", phone: "9654321098", email: "sanjay@gmail.com", age: 32, weight: 82, height: 170, plan: "Monthly", amountPaid: 1500, paymentMethod: "Card", joinDate: "2026-02-20", expiryDate: addDays(today, -10), attendance: 30, status: "Expired" },
  { id: "10", name: "Anjali Gupta", phone: "9543210987", email: "anjali@gmail.com", age: 24, weight: 52, height: 155, plan: "Quarterly", amountPaid: 4500, paymentMethod: "UPI", joinDate: "2026-02-01", expiryDate: "2026-05-01", attendance: 85, status: "Active" },
];

export const initialPayments: Payment[] = [
  { id: "p1", memberId: "1", memberName: "Rahul Verma", date: "2025-01-10", amount: 4500, method: "UPI", plan: "Quarterly", recordedBy: "Vikram" },
  { id: "p2", memberId: "2", memberName: "Priya Singh", date: "2025-06-01", amount: 12000, method: "Card", plan: "Annual", recordedBy: "Vikram" },
  { id: "p3", memberId: "3", memberName: "Amit Srivastava", date: "2026-02-15", amount: 1500, method: "Cash", plan: "Monthly", recordedBy: "Vikram" },
  { id: "p4", memberId: "4", memberName: "Sneha Yadav", date: "2026-01-01", amount: 4500, method: "UPI", plan: "Quarterly", recordedBy: "Vikram" },
  { id: "p5", memberId: "5", memberName: "Deepak Tiwari", date: "2025-09-01", amount: 12000, method: "Card", plan: "Annual", recordedBy: "Vikram" },
  { id: "p6", memberId: "6", memberName: "Kavita Rani", date: "2026-03-01", amount: 1500, method: "UPI", plan: "Monthly", recordedBy: "Vikram" },
  { id: "p7", memberId: "5", memberName: "Deepak Tiwari", date: "2026-03-10", amount: 2000, method: "UPI", plan: "Quarterly", recordedBy: "Vikram", note: "Upgrade payment" },
  { id: "p8", memberId: "2", memberName: "Priya Singh", date: "2026-03-05", amount: 1500, method: "Card", plan: "Monthly", recordedBy: "Vikram", note: "Personal training add-on" },
];

// Generate some attendance records for the current month
export function generateAttendanceRecords(): AttendanceRecord[] {
  const records: AttendanceRecord[] = [];
  const year = today.getFullYear();
  const month = today.getMonth();
  const members = initialMembers.filter(m => m.status !== "Expired");

  for (let day = 1; day <= today.getDate(); day++) {
    const date = new Date(year, month, day);
    if (date.getDay() === 0) continue; // skip sundays
    const dateStr = fmt(date);
    // Random subset of members attended each day
    members.forEach(m => {
      if (Math.random() < (m.attendance / 100)) {
        records.push({ memberId: m.id, memberName: m.name, date: dateStr });
      }
    });
  }
  return records;
}
