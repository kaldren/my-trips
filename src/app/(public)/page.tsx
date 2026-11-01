import { ArrowRight, Luggage, Map, MapPinned } from "lucide-react";
import Link from "next/link";

import { RouteIllustration } from "@/components/illustrations/route-illustration";
import { Logo } from "@/components/layout/logo";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { IconBadge } from "@/components/ui/icon-badge";

const features = [
  {
    icon: <Luggage />,
    tone: "primary",
    title: "Log every trip",
    description:
      "Give each trip a name and dates, and keep all of them in one place.",
  },
  {
    icon: <MapPinned />,
    tone: "secondary",
    title: "Pin the places you visit",
    description:
      "Save the cities, cafés and trails you visit, each tied to a day of the trip.",
  },
  {
    icon: <Map />,
    tone: "plain",
    title: "See it all on a map",
    description:
      "Watch your routes and pins come together on one interactive map.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="rounded-xl">
          <Logo />
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Sign in
        </Link>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pt-10 pb-20 lg:grid-cols-[1.1fr_1fr] lg:pt-16">
          <div className="flex flex-col items-start gap-7">
            <span className="inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-secondary px-4 py-1.5 text-sm font-extrabold">
              Your travel journal
            </span>
            <h1 className="text-5xl leading-[1.05] font-black sm:text-6xl lg:text-7xl">
              Every trip, every place, all on one map.
            </h1>
            <p className="max-w-xl text-xl leading-relaxed">
              My Trips keeps the trips you take and the places you visit
              together, so you can look back on where you&apos;ve been.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard" className={buttonVariants({ size: "lg" })}>
                Open the app
                <ArrowRight data-icon="inline-end" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ variant: "outline", size: "lg" })}
              >
                Sign in
              </Link>
            </div>
          </div>

          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-[2.5rem] border-2 border-foreground bg-primary"
            />
            <div className="relative -rotate-1 rounded-[2.5rem] border-2 border-foreground bg-background bg-dots p-6 sm:p-10">
              <RouteIllustration />
            </div>
          </div>
        </section>

        <section className="border-y-2 border-foreground bg-land">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="gap-5">
                <IconBadge tone={feature.tone}>{feature.icon}</IconBadge>
                <div className="grid gap-2">
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-20">
          <div className="flex flex-col items-start gap-6 rounded-[2.5rem] border-2 border-foreground bg-primary p-8 shadow-pop-lg sm:flex-row sm:items-center sm:justify-between sm:p-12">
            {/* CTA banner: Lemon surface with Ink text. */}
            <h2 className="max-w-lg text-3xl font-black sm:text-4xl">
              Ready to pin your next adventure?
            </h2>
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Get started
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-foreground">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-6 text-sm font-semibold sm:flex-row sm:items-center">
          <Logo className="[&>span:last-child]:text-base" />
          <p>Made for people who love to wander.</p>
        </div>
      </footer>
    </div>
  );
}
