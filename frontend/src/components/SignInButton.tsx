"use client";

import { signIn } from "next-auth/react";

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn("azure-ad", { callbackUrl: "/" })}
      className="btn"
    >
      Mit Microsoft anmelden
    </button>
  );
}
