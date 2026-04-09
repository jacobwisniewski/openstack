import { z } from "zod";
import { prettifyError } from "@zod/core";
import { Result, ok, err } from "neverthrow";

export const ProfileEntrySchema = z.object({
  name: z.string().min(1),
  source: z.string(),
  installed_at: z.string().datetime(),
});

export const OpenStackConfigSchema = z.object({
  version: z.string(),
  active_profile: z.string(),
  profiles: z.array(ProfileEntrySchema),
});

export type ValidatedOpenStackConfig = z.infer<typeof OpenStackConfigSchema>;
export type ValidatedProfileEntry = z.infer<typeof ProfileEntrySchema>;

export function validateConfig(data: unknown): Result<ValidatedOpenStackConfig, string> {
  const result = OpenStackConfigSchema.safeParse(data);
  if (!result.success) {
    return err(prettifyError(result.error as never));
  }
  return ok(result.data);
}

export function validateProfileEntry(data: unknown): Result<ValidatedProfileEntry, string> {
  const result = ProfileEntrySchema.safeParse(data);
  if (!result.success) {
    return err(prettifyError(result.error as never));
  }
  return ok(result.data);
}
