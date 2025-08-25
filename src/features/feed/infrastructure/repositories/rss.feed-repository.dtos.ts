import z from "zod";
import { Z } from "zod-class";
import { Feed, FeedSchema } from "../../domain/entities/feed";
import { getPreviewImageFromUrl, getSourceFromUrl } from "../../lib/utils";

// Base schema for raw RSS item data - handles creator as string OR array
const RawRssFeedItemSchema = z.object({
	title: z.string(),
	link: z.string(),
	creator: z.union([z.string(), z.array(z.string())]).optional(),
	"dc:creator": z.union([z.string(), z.array(z.string())]).optional(),
	pubDate: z.string(),
	category: z.array(z.string()).optional().or(z.string().optional()),
	description: z.string().optional(),
});

// Helper function to normalize creator field (string or array)
const normalizeCreator = (creator: string | string[] | undefined): string | undefined => {
	if (!creator) return undefined;
	if (typeof creator === 'string') return creator;
	if (Array.isArray(creator)) return creator.join(', '); // Join multiple creators
	return undefined;
};

// Transformed schema that normalizes creator field
export const RssFeedItemSchema = RawRssFeedItemSchema.transform((data) => {
	// Prefer dc:creator over creator when available, handle both string and array
	const dcCreator = normalizeCreator(data["dc:creator"]);
	const regularCreator = normalizeCreator(data.creator);
	const normalizedCreator = dcCreator || regularCreator;
	
	return {
		title: data.title,
		link: data.link,
		creator: normalizedCreator,
		pubDate: data.pubDate,
		category: data.category,
		description: data.description,
	};
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
					thumbnailUrl: thumbnailUrl || undefined, // Convert null to undefined
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
