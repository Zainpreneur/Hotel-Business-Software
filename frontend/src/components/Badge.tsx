const COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  OCCUPIED: "bg-red-100 text-red-800",
  RESERVED: "bg-amber-100 text-amber-800",
  MAINTENANCE: "bg-orange-100 text-orange-800",
  CLEANING: "bg-blue-100 text-blue-800",
  OUT_OF_SERVICE: "bg-slate-200 text-slate-700",

  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  CHECKED_IN: "bg-green-100 text-green-800",
  CHECKED_OUT: "bg-slate-200 text-slate-700",
  CANCELLED: "bg-red-100 text-red-800",
  NO_SHOW: "bg-red-100 text-red-800",

  UNPAID: "bg-red-100 text-red-800",
  PARTIALLY_PAID: "bg-amber-100 text-amber-800",
  PAID: "bg-green-100 text-green-800",
  VOID: "bg-slate-200 text-slate-700",

  IN_PROGRESS: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
};

export default function Badge({ value }: { value: string }) {
  const color = COLORS[value] || "bg-slate-100 text-slate-700";
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${color}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}
