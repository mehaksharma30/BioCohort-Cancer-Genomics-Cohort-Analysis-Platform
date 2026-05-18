export default function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
      <div className="font-semibold">Unable to load this view</div>
      <p className="mt-1">{message}</p>
      {onRetry && <button onClick={onRetry} className="mt-4 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Retry</button>}
    </div>
  );
}
