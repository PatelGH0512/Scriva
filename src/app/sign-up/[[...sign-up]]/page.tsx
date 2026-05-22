import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-scriva-bg)" }}
    >
      <div className="text-center">
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ color: "var(--foreground)" }}
        >
          Create your Scriva account
        </h1>
        <p
          className="text-sm mb-8"
          style={{ color: "var(--muted-foreground)" }}
        >
          Your thinking workspace awaits
        </p>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-[#131820] border border-[#1e293b]",
            },
          }}
        />
      </div>
    </div>
  );
}
