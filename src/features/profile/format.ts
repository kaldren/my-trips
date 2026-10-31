/** Shown when a user has not set a name. */
export const FALLBACK_NAME = "Traveller";

export function profileName(displayName: string | null): string {
  return displayName?.trim() || FALLBACK_NAME;
}

/** The first letter of the name, for avatars. */
export function profileInitial(displayName: string | null): string {
  return Array.from(profileName(displayName))[0]?.toUpperCase() ?? "?";
}

