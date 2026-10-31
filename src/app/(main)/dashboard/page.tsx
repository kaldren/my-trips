import { ArrowRight, Luggage, Map } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { IconBadge } from "@/components/ui/icon-badge";

export const metadata: Metadata = { title: "Dashboard" };

const shortcuts = [
  {
    href: "/trips",
    icon: <Luggage />,
    title: "Your trips",
    description: "Browse every trip you've logged, newest first.",
    tone: "primary",
  },
  {
    href: "/map",
    icon: <Map />,
    title: "Your map",
    description: "See all the places you've visited as pins on one map.",
    tone: "accent",
  },
] as const;

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Dashboard"
        title="Where to next?"
        description="Jump back into your trips or explore everything you've pinned so far."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-3xl outline-none focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <Card interactive className="h-full flex-row items-center gap-5">
              <IconBadge tone={s.tone} className="size-16 [&_svg]:size-8">
                {s.icon}
              </IconBadge>
              <div className="grid flex-1 gap-1">
                <CardTitle className="text-2xl">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </div>
              <ArrowRight
                aria-hidden="true"
                className="size-6 shrink-0 stroke-[2.5] transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              />
            </Card>
          </Link>
        ))}
      </div>

      <section className="flex flex-col gap-5">
        <h2 className="text-2xl font-extrabold">Recent trips</h2>
        <EmptyState
          icon={<Luggage />}
          title="No trips yet"
          description="Your most recent trips will show up here once you've added some."
          action={
            <Link href="/trips" className={buttonVariants()}>
              Go to trips
              <ArrowRight data-icon="inline-end" />
            </Link>
          }
        />
      </section>
    </div>
  );
}
