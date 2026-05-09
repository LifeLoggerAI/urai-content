import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://www.uraicontent.com'),
  NEXT_PUBLIC_URAI_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_URAI_STUDIO_URL: z.string().url().optional(),
  NEXT_PUBLIC_URAI_ADMIN_URL: z.string().url().optional(),
  NEXT_PUBLIC_GITHUB_ISSUES_URL: z.string().url().optional(),
  NEXT_PUBLIC_CI_RUN_URL: z.string().url().optional()
});

export type WebEnv = z.infer<typeof envSchema>;

export function getWebEnv(input: NodeJS.ProcessEnv = process.env): WebEnv {
  return envSchema.parse(input);
}

export const webEnv = getWebEnv();
