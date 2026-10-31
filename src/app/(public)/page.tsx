import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-3xl font-semibold">My Trips</h1>
      <p className="text-muted-foreground">
        Track your trips and the places you visit.
      </p>
      <Link href="/dashboard" className="text-sm underline underline-offset-4">
        Open the app
      </Link>
    </main>
  );
}
