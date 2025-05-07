import { AppConfigSchema } from "@/infrastructure/config.schemas";
import { z } from "zod";
import { ThemeOptionSchema } from "../app-store.schemas";

export const AppConfigSliceSchema = z.object({
	appConfig: AppConfigSchema,
	setAppConfig: z.function().args(AppConfigSchema).returns(z.void()),
	setTheme: z.function().args(ThemeOptionSchema).returns(z.void()),
});

export type AppConfigSlice = z.infer<typeof AppConfigSliceSchema>;
