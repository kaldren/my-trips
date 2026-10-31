import { GlobeIcon, LockIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import type { TripVisibility } from "../schemas";

export function TripVisibilityBadge({
  visibility,
  className,
}: {
  visibility: TripVisibility;
  className?: string;
}) {
  const isPublic = visibility === "public";
  const Icon = isPublic ? GlobeIcon : LockIcon;

  return (
    <Badge
      variant="outline"
      className={cn("border-foreground bg-background", className)}
    >
      <Icon aria-hidden data-icon="inline-start" />
      {isPublic ? "Public" : "Private"}
    </Badge>
  );
}
