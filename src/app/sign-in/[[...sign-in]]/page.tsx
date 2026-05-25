import { SignIn } from "@clerk/nextjs";
import { ScrivaWordmark } from "@/components/ui/ScrivaWordmark";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#0e1117" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 45%, rgba(13,148,136,0.07) 0%, transparent 70%)",
        }}
      />

      {/* Hero wordmark */}
      <div className="relative z-10 flex flex-col items-center mb-10">
        <ScrivaWordmark size="xl" />
        <p
          className="mt-3 text-sm tracking-wide"
          style={{ color: "#4b5563", letterSpacing: "0.08em" }}
        >
          THINK FREELY. WRITE CLEARLY.
        </p>
      </div>

      {/* Auth widget */}
      <div className="relative z-10">
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#0d1117] border border-[rgba(255,255,255,0.06)] shadow-2xl",
              headerTitle: "hidden",
              headerSubtitle: "hidden",
              badge: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
