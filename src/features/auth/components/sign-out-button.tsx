import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

import { signOut } from "../actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        <LogOut data-icon="inline-start" />
        <span className="sr-only sm:not-sr-only">Sign out</span>
      </Button>
    </form>
  );
}
