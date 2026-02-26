import { LobstersStory } from "../../domain/entities/story";
import {
	FetchLobstersStoryParams,
	LobstersStoryRepository,
} from "../../domain/repositories/story";
import { LobstersApiResponseSchema, mapApiItemToStory } from "./http.dtos";

const BASE = "https://lobste.rs";

export class HttpLobstersStoryRepository implements LobstersStoryRepository {
	public async fetchMany(
		params: FetchLobstersStoryParams
	): Promise<LobstersStory[]> {
		const url = params.tag
			? `${BASE}/t/${encodeURIComponent(params.tag)}.json`
			: `${BASE}/${params.sort}.json`;

		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(
				`Lobste.rs fetch failed: ${response.status} ${response.statusText}`
			);
		}

		const json = await response.json();
		const items = LobstersApiResponseSchema.parse(json);
		return items.slice(0, params.limit).map(mapApiItemToStory);
	}
}
