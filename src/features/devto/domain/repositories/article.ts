import { DevtoArticle } from "../entities/article";
import { DevtoWidgetConfig } from "../../infrastructure/config.schemas";

export type FetchDevtoArticleParams = Pick<
	DevtoWidgetConfig,
	"tags" | "top" | "limit"
>;

export interface DevtoArticleRepository {
	fetchMany(params: FetchDevtoArticleParams): Promise<DevtoArticle[]>;
}
