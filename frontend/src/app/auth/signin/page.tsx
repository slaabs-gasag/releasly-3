import SignInButton from "@/components/SignInButton";
import DevLoginButton from "@/components/DevLoginButton";

export default function SignInPage() {
  return (
    <div className="standalone">
      <div className="standalone__box">
        <div className="standalone__brand">
          <div className="standalone__logo" aria-label="GASAG" />
          <div className="standalone__product">Releasly</div>
        </div>

        <h2 style={{ font: "700 24px/1.2 var(--gs-font-sans)", color: "var(--app-fg-1)", margin: "0 0 8px" }}>
          Anmelden
        </h2>
        <p style={{ font: "400 14px/1.5 var(--gs-font-sans)", color: "var(--app-fg-2)", margin: "0 0 28px" }}>
          Internes Release-Management-Dashboard für GASAG-Produktteams.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SignInButton />
          <DevLoginButton />
        </div>
      </div>
    </div>
  );
}
