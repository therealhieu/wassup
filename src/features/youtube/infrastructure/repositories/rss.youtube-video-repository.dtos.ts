import { z } from "zod";
import { YoutubeVideoSchema } from "../../domain/entities/video";
import { YoutubeVideo } from "../../domain/entities/video";
import { Z } from "zod-class";

export const YoutubeFeedEntrySchema = z.object({
	id: z.string().transform(id => id.replace('yt:video:', '')),
	videoId: z.string(),
	title: z.string(),
	link: z.object({
		rel: z.string(),
		href: z.string(),
	}),
	author: z.object({
		name: z.string(),
		uri: z.string(),
	}),
	published: z.string(),
	updated: z.string(),
	group: z.object({
		title: z.string(),
		content: z.object({
			url: z.string(),
			type: z.string(),
			width: z.string(),
			height: z.string(),
		}),
		thumbnail: z.object({
			url: z.string(),
			width: z.string(),
			height: z.string(),
		}),
		description: z.string(),
		community: z.object({
			starRating: z.object({
				count: z.string(),
				average: z.string(),
				min: z.string(),
				max: z.string(),
			}),
			statistics: z.object({
				views: z.string(),
			}),
		}),
	}),
});

export class YoutubeFeedEntry extends Z.class(YoutubeFeedEntrySchema.shape) {
	public toYoutubeVideo(): YoutubeVideo {
		return YoutubeVideoSchema.parse({
			id: this.id,
			title: this.title,
			url: this.link.href,
			authorName: this.author.name,
			authorUrl: this.author.uri,
			thumbnailUrl: this.group.thumbnail.url,
			views: Number(this.group.community.statistics.views),
			publishedAt: this.published,
		});
	}
}

export const YoutubeFeedSchema = z.object({
	feed: z.object({
		entry: z
			.array(YoutubeFeedEntrySchema)
			.transform((entries) =>
				entries.map((entry) => YoutubeFeedEntry.parse(entry))
			),
	}),
});

export type YoutubeFeed = z.infer<typeof YoutubeFeedSchema>;
