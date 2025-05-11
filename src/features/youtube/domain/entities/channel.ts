import { z } from "zod";

export const YoutubeChannelSchema = z.object({
	id: z.string(),
	name: z.string(),
	rssUrl: z.string(),
	channelUrl: z.string(),
});

export type YoutubeChannel = z.infer<typeof YoutubeChannelSchema>;
