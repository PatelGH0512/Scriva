import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "var(--color-scriva-bg)" }}
    >
      <div className="text-center">
        <h1
          className="text-2xl font-semibold mb-8"
          style={{ color: "var(--foreground)" }}
        >
          Welcome back to Scriva
        </h1>
        <SignIn
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
