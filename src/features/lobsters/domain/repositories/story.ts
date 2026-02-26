import { LobstersStory } from "../entities/story";
import { LobstersWidgetConfig } from "../../infrastructure/config.schemas";

export type FetchLobstersStoryParams = Pick<
	LobstersWidgetConfig,
	"sort" | "tag" | "limit"
>;

export interface LobstersStoryRepository {
	fetchMany(params: FetchLobstersStoryParams): Promise<LobstersStory[]>;
}
