import { HackerNewsStory } from "../../domain/entities/story";
import {
	FetchStoryParams,
	HackerNewsStoryRepository,
} from "../../domain/repositories/story";
import {
	AlgoliaSearchResponseSchema,
	FirebaseItemDtoSchema,
	mapAlgoliaHitToStory,
	mapFirebaseItemToStory,
} from "./http.dtos";

const FIREBASE_SORT_ENDPOINTS: Record<string, string> = {
	top: "/topstories.json",
	best: "/beststories.json",
	new: "/newstories.json",
	ask: "/askstories.json",
	show: "/showstories.json",
};

const ALGOLIA_SORT_TAGS: Record<string, string> = {
	top: "story",
	best: "story",
	new: "story",
	ask: "ask_hn",
	show: "show_hn",
};

export class HttpHackerNewsStoryRepository
	implements HackerNewsStoryRepository
{
	private readonly FIREBASE_BASE =
		"https://hacker-news.firebaseio.com/v0";
	private readonly ALGOLIA_BASE = "https://hn.algolia.com/api/v1";

	public async fetchMany(
		params: FetchStoryParams
	): Promise<HackerNewsStory[]> {
		if (params.query) {
			return this.fetchFromAlgolia(params);
		}
		return this.fetchFromFirebase(params);
	}

	private async fetchFromAlgolia(
		params: FetchStoryParams
	): Promise<HackerNewsStory[]> {
		const endpoint =
			params.sort === "new" ? "search_by_date" : "search";
		const tag = ALGOLIA_SORT_TAGS[params.sort] ?? "story";
		const url =
			`${this.ALGOLIA_BASE}/${endpoint}?` +
			`query=${encodeURIComponent(params.query!)}&tags=${tag}&hitsPerPage=${params.limit}`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Algolia HN search failed: ${response.status} ${response.statusText}`
			);
		}

		const json = await response.json();
		const parsed = AlgoliaSearchResponseSchema.parse(json);
		return parsed.hits.map(mapAlgoliaHitToStory);
	}

	private async fetchFromFirebase(
		params: FetchStoryParams
	): Promise<HackerNewsStory[]> {
		const endpoint =
			FIREBASE_SORT_ENDPOINTS[params.sort] ??
			FIREBASE_SORT_ENDPOINTS.top;

		const idsResponse = await fetch(
			`${this.FIREBASE_BASE}${endpoint}`
		);
		if (!idsResponse.ok) {
			throw new Error(
				`Firebase HN fetch failed: ${idsResponse.status} ${idsResponse.statusText}`
			);
		}

		const ids: number[] = await idsResponse.json();
		const sliced = ids.slice(0, params.limit);

		const items = await Promise.all(
			sliced.map((id) =>
				fetch(`${this.FIREBASE_BASE}/item/${id}.json`).then((r) =>
					r.json()
				)
			)
		);

		return items
			.filter(Boolean)
			.map((item) =>
				mapFirebaseItemToStory(FirebaseItemDtoSchema.parse(item))
			);
	}
}
