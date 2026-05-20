export default function OverdueIndicator({ daysOverdue }: { daysOverdue?: number }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Overdue{daysOverdue !== undefined ? ` ${daysOverdue}d` : ""}
    </span>
  );
}
