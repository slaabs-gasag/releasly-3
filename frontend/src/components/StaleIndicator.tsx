export default function StaleIndicator({ fetchedAt }: { fetchedAt?: string | null }) {
  let label = "Stale data";
  if (fetchedAt) {
    const diff = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60000);
    label = `Stale — updated ${diff}m ago`;
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      {label}
    </span>
  );
}
