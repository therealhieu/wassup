import z from "zod";

export const YoutubeWidgetConfigSchema = z.object({
	type: z.literal("youtube"),
	showTitle: z.boolean().default(true),
	limit: z.number().min(1).max(50).default(12),
	channels: z.array(
		z.string().refine(
			(value) => value.startsWith("UC") || value.startsWith("@"),
			{
				message: "Channel ID must start with 'UC' or '@'"
			}
		)
	)
}).refine(
	(data) => data.channels.length > 0,
	{
		message: "At least one channel must be provided"
	}
);

export type YoutubeWidgetConfig = z.infer<typeof YoutubeWidgetConfigSchema>;
