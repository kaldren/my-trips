import { z } from "zod";

export const DISPLAY_NAME_MAX = 60;
export const BIO_MAX = 280;
export const LOCATION_MAX = 100;
export const AGE_MIN = 13;
export const AGE_MAX = 120;
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

/*
 * Username rules, mirrored by the profiles table constraints in
 * supabase/migrations/20261101120000_profile_usernames.sql. Keep the two in
 * sync. The database also lets official accounts use reserved handles.
 */
const USERNAME_PATTERN = /^[A-Za-z0-9_]+$/;
/*
 * Reserved handles would let someone pose as the platform or its staff, or
 * are platform words. Profiles live at /<username>, so every top-level route
 * (/trips, /map, ...) must be reserved too; schemas.test.ts checks this.
 * Handles containing any of these are reserved.
 */
const RESERVED_USERNAME_PARTS = ["admin", "moderator", "mytrips", "my_trips"];
/** Handles equal to any of these are reserved. */
const RESERVED_USERNAMES = new Set([
  "_next", "_vercel", "about", "account", "anonymous", "api", "auth",
  "callback", "dashboard", "everyone", "explore", "help", "home",
  "login", "logout", "map", "new", "null", "official", "privacy",
  "profile", "root", "search", "security", "settings", "signin",
  "signup", "staff", "support", "system", "terms", "trips",
  "undefined", "users",
]);

/** Whether a handle is kept for official accounts. Case-insensitive. */
export function isReservedUsername(username: string): boolean {
  const lower = username.toLowerCase();
  return (
    RESERVED_USERNAMES.has(lower) ||
    RESERVED_USERNAME_PARTS.some((part) => lower.includes(part))
  );
}

/** Whether a string has the shape of a username (not whether it is free). */
export function isUsernameFormat(value: string): boolean {
  return (
    value.length >= USERNAME_MIN &&
    value.length <= USERNAME_MAX &&
    USERNAME_PATTERN.test(value)
  );
}

export const USERNAME_RESERVED_MESSAGE = "That username is reserved. Try another one.";
export const USERNAME_TAKEN_MESSAGE = "That username is taken. Try another one.";

/**
 * Optional username: trimmed, a leading "@" dropped, and blank becomes null
 * (the profile is then addressed by the user's id). Reserved handles are
 * checked by the action, because official accounts may use them.
 */
const optionalUsername = z
  .string()
  .trim()
  .transform((value) => value.replace(/^@/, ""))
  .pipe(
    z
      .string()
      .max(USERNAME_MAX, `Use at most ${USERNAME_MAX} characters.`)
      .refine((value) => value === "" || value.length >= USERNAME_MIN, {
        message: `Use at least ${USERNAME_MIN} characters.`,
      })
      .refine((value) => value === "" || USERNAME_PATTERN.test(value), {
        message: "Use only letters, numbers and underscores.",
      }),
  )
  .transform((value) => value || null);

/** Typed into confirm deleting the account. */
export const DELETE_CONFIRMATION = "delete";

/** Optional text: trimmed, and blank becomes null. */
function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null);
}

/** Optional whole number typed into a field: blank becomes null. */
function optionalWholeNumber(min: number, max: number, message: string) {
  return z
    .string()
    .trim()
    .transform((value, ctx) => {
      if (value === "") return null;
      const number = Number(value);
      if (!Number.isInteger(number) || number < min || number > max) {
        ctx.addIssue({ code: "custom", message });
        return z.NEVER;
      }
      return number;
    });
}

/** The profile form. Every field is optional; values arrive as typed. */
export const profileSchema = z.object({
  username: optionalUsername,
  displayName: optionalText(
    DISPLAY_NAME_MAX,
    `Keep your name under ${DISPLAY_NAME_MAX} characters.`,
  ),
  bio: optionalText(BIO_MAX, `Keep it under ${BIO_MAX} characters.`),
  age: optionalWholeNumber(
    AGE_MIN,
    AGE_MAX,
    `Enter an age from ${AGE_MIN} to ${AGE_MAX}.`,
  ),
  location: optionalText(
    LOCATION_MAX,
    `Keep the location under ${LOCATION_MAX} characters.`,
  ),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type ProfileFieldErrors = Partial<Record<keyof ProfileInput, string[]>>;

export const deleteAccountSchema = z.object({
  confirmation: z
    .string()
    .trim()
    .toLowerCase()
    .refine((value) => value === DELETE_CONFIRMATION, {
      message: `Type “${DELETE_CONFIRMATION}” to confirm.`,
    }),
});
