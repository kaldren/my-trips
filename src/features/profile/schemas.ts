import { z } from "zod";

export const DISPLAY_NAME_MAX = 60;
export const BIO_MAX = 280;
export const LOCATION_MAX = 100;
export const AGE_MIN = 13;
export const AGE_MAX = 120;

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
