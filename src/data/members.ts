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
  // 👇 Added "Inactive" here for the Soft Deletion feature
  status: "Active" | "Expiring Soon" | "Expired" | "Inactive"; 
  // 👇 Added these 3 optional lines for Partial Payments
  total_fee?: number;
  balance_due?: number;
  next_due_date?: string;
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
  id: string;
  memberId: string;
  date: string;
  status: "Present" | "Absent";
}