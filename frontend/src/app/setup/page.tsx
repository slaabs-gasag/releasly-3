import CredentialSetupForm from "@/components/CredentialSetupForm";

export default function SetupPage() {
  return (
    <div className="standalone">
      <div className="standalone__box" style={{ maxWidth: 520 }}>
        <div className="standalone__brand">
          <div className="standalone__logo" aria-label="GASAG" />
          <div className="standalone__product">Releasly</div>
        </div>

        <h2 style={{ font: "700 24px/1.2 var(--gs-font-sans)", color: "var(--app-fg-1)", margin: "0 0 8px" }}>
          Integrationen einrichten
        </h2>
        <p style={{ font: "400 14px/1.5 var(--gs-font-sans)", color: "var(--app-fg-2)", margin: "0 0 28px" }}>
          Zugangsdaten werden ausschließlich im Browser gespeichert und nie an den Server übertragen — nur als Request-Header beim Abrufen von Release-Daten.
        </p>

        <CredentialSetupForm />
      </div>
    </div>
  );
}
