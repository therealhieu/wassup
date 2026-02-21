import z from "zod";
import { Z } from "zod-class";
import { Feed, FeedSchema } from "../../domain/entities/feed";
import { getSourceFromUrl } from "../../lib/utils";

// Schema for enclosure element (e.g. <enclosure url="..." type="image/jpeg" />)
const EnclosureSchema = z
	.object({
		url: z.string(),
		type: z.string().optional(),
	})
	.optional();

// Base schema for raw RSS item data - handles creator as string OR array
const RawRssFeedItemSchema = z.object({
	title: z.string(),
	link: z.string(),
	creator: z.union([z.string(), z.array(z.string())]).optional(),
	"dc:creator": z.union([z.string(), z.array(z.string())]).optional(),
	pubDate: z.string(),
	category: z.array(z.string()).optional().or(z.string().optional()),
	description: z.string().optional(),
	// Media fields for thumbnail extraction (1a optimization)
	enclosure: EnclosureSchema,
	// media:thumbnail → "thumbnail" after removeNSPrefix
	thumbnail: z
		.union([
			z.object({ url: z.string() }),
			z.string(),
		])
		.optional(),
});

// Helper function to normalize creator field (string or array)
const normalizeCreator = (creator: string | string[] | undefined): string | undefined => {
	if (!creator) return undefined;
	if (typeof creator === 'string') return creator;
	if (Array.isArray(creator)) return creator.join(', '); // Join multiple creators
	return undefined;
};

/**
 * Extract embedded thumbnail URL from RSS item fields.
 * Priority: media:thumbnail > enclosure (image type only)
 */
const extractEmbeddedThumbnail = (data: z.infer<typeof RawRssFeedItemSchema>): string | undefined => {
	// 1. media:thumbnail (parsed as "thumbnail" after removeNSPrefix)
	if (data.thumbnail) {
		if (typeof data.thumbnail === 'string') return data.thumbnail;
		if (typeof data.thumbnail === 'object' && 'url' in data.thumbnail) return data.thumbnail.url;
	}

	// 2. enclosure with image type
	if (data.enclosure?.url && data.enclosure.type?.startsWith("image/")) {
		return data.enclosure.url;
	}

	return undefined;
};

// Transformed schema that normalizes creator field and extracts thumbnail
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
		thumbnailUrl: extractEmbeddedThumbnail(data),
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
	private source: string;

	constructor(rss: z.infer<typeof RssFeedSchema>, url: string) {
		super(rss);
		this.source = getSourceFromUrl(url);
	}

	public static parseExt(obj: unknown, url: string, limit: number): RssFeed {
		const feed = RssFeedSchema.parse(obj);
		feed.rss.channel.item = feed.rss.channel.item.slice(0, limit);
		return new RssFeed(feed, url);
	}

	/**
	 * Convert RSS items to Feed entities synchronously.
	 * Uses embedded thumbnails from RSS XML (1a) — no OG scraping (1c).
	 * Missing thumbnails are resolved lazily on the client.
	 */
	public toFeeds(): Feed[] {
		return this.rss.channel.item.map((item) => {
			return FeedSchema.parse({
				title: item.title,
				feedUrl: item.link,
				thumbnailUrl: item.thumbnailUrl,
				author: item.creator,
				publishedAt: item.pubDate,
				categories: item.category,
				source: this.source,
				description: item.description,
			});
		});
	}
}
