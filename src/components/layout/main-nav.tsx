"use client";

import { LayoutDashboard, Luggage, Map, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Luggage },
  { href: "/map", label: "Map", icon: Map },
  { href: "/profile", label: "Profile", icon: UserRound },
] as const;

type Variant = "bar" | "tabs";

// `bar` is the inline header nav (md and up); `tabs` is the mobile bottom bar.
// Active links get an Ink outline and pop shadow, not just a green fill.
// usePathname suspends on routes with unknown dynamic params, so the nav
// prerenders without an active link and fills it in at request time.
export function MainNav({
  variant = "bar",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <Suspense fallback={<NavLinks variant={variant} className={className} pathname={null} />}>
      <ActiveNavLinks variant={variant} className={className} />
    </Suspense>
  );
}

function ActiveNavLinks(props: { variant: Variant; className?: string }) {
  return <NavLinks {...props} pathname={usePathname()} />;
}

function NavLinks({
  variant,
  className,
  pathname,
}: {
  variant: Variant;
  className?: string;
  pathname: string | null;
}) {
  return (
    <nav aria-label="Main" className={className}>
      <ul
        className={cn(
          "flex items-center",
          variant === "bar" ? "gap-2" : "justify-around gap-1",
        )}
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            pathname !== null &&
            (pathname === href || pathname.startsWith(`${href}/`));
          return (
            <li key={href} className={cn(variant === "tabs" && "flex-1")}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-2xl border-2 font-extrabold transition-[translate,box-shadow,background-color] duration-150 outline-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring motion-reduce:transition-none",
                  variant === "bar"
                    ? "h-11 px-4 text-base"
                    : "h-16 w-full flex-col justify-center gap-0.5 text-xs",
                  active
                    ? "border-foreground bg-accent text-accent-foreground shadow-pop-sm"
                    : "border-transparent hover:bg-muted",
                )}
              >
                <Icon
                  aria-hidden="true"
                  className={cn("stroke-[2.5]", variant === "bar" ? "size-5" : "size-6")}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
