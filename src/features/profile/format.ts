/** Shown when a user has not set a name. */
export const FALLBACK_NAME = "Traveller";

export function profileName(displayName: string | null): string {
  return displayName?.trim() || FALLBACK_NAME;
}

/** The first letter of the name, for avatars. */
export function profileInitial(displayName: string | null): string {
  return Array.from(profileName(displayName))[0]?.toUpperCase() ?? "?";
}


/** The handle in a profile's address: the username, or the user id without one. */
export function profileHandle(profile: { id: string; username: string | null }): string {
  return profile.username ?? profile.id;
}

/** The address of a user's profile, like /username. */
export function profilePath(profile: { id: string; username: string | null }): string {
  return `/${profileHandle(profile)}`;
}
