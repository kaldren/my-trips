import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { RouteIllustration } from "@/components/illustrations/route-illustration";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="w-56 -rotate-3 rounded-[2rem] border-2 border-foreground bg-dots p-5 shadow-pop">
        <RouteIllustration />
      </div>
      <div className="grid gap-3">
        <p className="text-sm font-extrabold tracking-widest uppercase">404</p>
        <h1 className="text-4xl font-black sm:text-5xl">Page not found</h1>
        <p className="text-lg">Looks like this road doesn&apos;t go anywhere.</p>
      </div>
      <Link href="/" className={buttonVariants({ size: "lg" })}>
        <ArrowLeft data-icon="inline-start" />
        Go home
      </Link>
    </main>
  );
}
