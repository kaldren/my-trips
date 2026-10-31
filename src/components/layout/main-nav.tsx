import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/trips", label: "Trips" },
  { href: "/map", label: "Map" },
] as const;

export function MainNav() {
  return (
    <nav className="flex items-center gap-4 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-muted-foreground hover:text-foreground"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
