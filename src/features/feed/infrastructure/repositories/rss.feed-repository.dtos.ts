import z from "zod";
import { Z } from "zod-class";
import { Feed, FeedSchema } from "../../domain/entities/feed";
import { getPreviewImageFromUrl, getSourceFromUrl } from "../../lib/utils";

export const RssFeedItemSchema = z.object({
	title: z.string(),
	link: z.string(),
	creator: z.string(),
	pubDate: z.string(),
	category: z.array(z.string()).optional().or(z.string().optional()),
	description: z.string().optional(),
});

export type RssFeedItem = z.infer<typeof RssFeedItemSchema>;

export const RssFeedSchema = z.object({
	rss: z.object({
		channel: z.object({
			item: z.array(RssFeedItemSchema),
		}),
	}),
});

export class RssFeed extends Z.class(RssFeedSchema.shape) {
	private url: string;
	private source: string;

	constructor(rss: z.infer<typeof RssFeedSchema>, url: string) {
		super(rss);
		this.url = url;
		this.source = getSourceFromUrl(url);
	}

	public static parseExt(obj: unknown, url: string, limit: number): RssFeed {
		const feed = RssFeedSchema.parse(obj);
		feed.rss.channel.item = feed.rss.channel.item.slice(0, limit);
		return new RssFeed(feed, url);
	}

	public async toFeeds(): Promise<Feed[]> {
		return Promise.all(
			this.rss.channel.item.map(async (item) => {
				const thumbnailUrl = await getPreviewImageFromUrl(item.link);
				return FeedSchema.parse({
					title: item.title,
					feedUrl: item.link,
					thumbnailUrl: thumbnailUrl,
					author: item.creator,
					publishedAt: item.pubDate,
					categories: item.category,
					source: this.source,
					description: item.description,
				});
			})
		);
	}
}
