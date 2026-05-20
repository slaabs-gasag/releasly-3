"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAuthError =
    error.message?.includes("401") ||
    error.message?.toLowerCase().includes("authentication");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>

        {isAuthError ? (
          <p className="text-sm text-gray-500">
            Your integration credentials were rejected or are missing.{" "}
            <Link href="/setup" className="text-blue-600 underline font-medium">
              Update credentials
            </Link>
          </p>
        ) : (
          <p className="text-sm text-gray-500">
            Backend unavailable or an unexpected error occurred. Ensure the
            server is running and try again.
          </p>
        )}

        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
