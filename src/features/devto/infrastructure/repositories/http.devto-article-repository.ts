import { DevtoArticle } from "../../domain/entities/article";
import {
	FetchDevtoArticleParams,
	DevtoArticleRepository,
} from "../../domain/repositories/article";
import { DevtoApiResponseSchema, mapApiItemToArticle } from "./http.dtos";

const BASE = "https://dev.to/api/articles";

export class HttpDevtoArticleRepository implements DevtoArticleRepository {
	public async fetchMany(
		params: FetchDevtoArticleParams,
	): Promise<DevtoArticle[]> {
		const searchParams = new URLSearchParams();
		searchParams.set("per_page", String(params.limit));

		if (params.tags?.length) {
			searchParams.set("tags", params.tags.join(","));
		}
		if (params.top) {
			searchParams.set("top", params.top);
		}

		const url = `${BASE}?${searchParams.toString()}`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(
				`Dev.to fetch failed: ${response.status} ${response.statusText}`,
			);
		}

		const json = await response.json();
		const items = DevtoApiResponseSchema.parse(json);
		return items.map(mapApiItemToArticle);
	}
}
