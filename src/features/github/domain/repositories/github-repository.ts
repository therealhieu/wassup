import { GithubRepository } from "../entities/github-repository";
import { GithubWidgetConfig } from "../../infrastructure/config.schemas";

export interface GithubRepositoryRepository {
	search(config: GithubWidgetConfig): Promise<GithubRepository[]>;
	enrichWithRecentStars(
		repos: GithubRepository[],
		dateRange: string
	): Promise<GithubRepository[]>;
}
