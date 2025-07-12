
import { z } from 'zod';

export const settingsSchema = z.object({
    notifications: z.object({
        email: z.boolean().default(false),
        push: z.boolean().default(false),
        weeklySummary: z.boolean().default(false),
    }),
    ai: z.object({
        defaultModel: z.string().default('smart-ai'),
        responseStyle: z.enum(['concise', 'balanced', 'detailed']).default('balanced'),
        voice: z.string().default('Algenib'),
    }),
});

export type SettingsData = z.infer<typeof settingsSchema>;
