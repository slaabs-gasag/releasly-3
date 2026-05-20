"use client";

import { signIn } from "next-auth/react";

export default function DevLoginButton() {
  if (process.env.NEXT_PUBLIC_DEV_AUTH !== "true") return null;

  return (
    <button
      data-testid="dev-login-button"
      onClick={() => signIn("dev", { callbackUrl: "/" })}
      className="btn btn--ghost"
    >
      Dev-Anmeldung (nur lokal)
    </button>
  );
}
