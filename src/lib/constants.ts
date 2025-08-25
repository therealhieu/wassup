import { AppConfig, AppConfigSchema } from "@/infrastructure/config.schemas";
import { toSkeletonConfig } from "./utils";
import zodToJsonSchema from "zod-to-json-schema";

export const THEME_OPTIONS = ["light", "dark"] as const;

export const DEFAULT_CONFIG: AppConfig = AppConfigSchema.parse({
	ui: {
		theme: "light",
		pages: [
			{
				title: "Home",
				path: "/",
				columns: [
					{
						size: 2,
						widgets: [
							{
								type: "weather",
								location: "Ho Chi Minh City",
							},
							{
								type: "bookmark",
								title: "Bookmarks",
								groups: [
									{
										title: "DSA",
										bookmarks: ["https://www.neetcode.io"],
									},
									{
										title: "System Design",
										bookmarks: [
											"https://www.hellointerview.com",
											"https://github.com/ashishps1/awesome-system-design-resources",
										],
									},
									{
										title: "Data",
										bookmarks: [
											"https://blog.dataengineerthings.org/",
											"https://blog.det.life/a-non-beginner-data-engineering-roadmap-2025-edition-2b39d865dd0b",
										],
									},
									{
										title: "AI",
										bookmarks: [
											"https://github.com/e2b-dev/awesome-ai-agents",
										],
									},
									{
										title: "Engineering",
										bookmarks: [
											"https://codecrafters.io/",
											"https://github.com/practical-tutorials/project-based-learning",
										],
									},
								],
							},
						],
					},
					{
						size: 7,
						widgets: [
							{
								type: "tabs",
								labels: [
									"r/compsci",
									"r/rust",
									"r/vozforums",
									"r/dataengineering",
									"r/leetcode",
								],
								tabs: [
									{
										type: "reddit",
										subreddit: "compsci",
										hideTitle: true,
										sort: "new",
										limit: 5,
									},
									{
										type: "reddit",
										subreddit: "rust",
										hideTitle: true,
										sort: "new",
										limit: 5,
									},
									{
										type: "reddit",
										subreddit: "vozforums",
										hideTitle: true,
										sort: "new",
										limit: 5,
									},
									{
										type: "reddit",
										subreddit: "dataengineering",
										hideTitle: true,
										sort: "new",
										limit: 5,
									},
									{
										type: "reddit",
										subreddit: "leetcode",
										hideTitle: true,
										sort: "new",
										limit: 5,
									},
								],
							},
							{
								type: "youtube",
								channels: [
									"@CMUDatabaseGroup",
									"@hello_interview",
									"@jordanhasnolife5163",
									"@ALifeEngineered",
									"@Fireship",
									"@ThePrimeTimeagen",
								],
							},
						],
					},
					{
						size: 3,
						widgets: [
							{
								type: "feed",
								limit: 10,
								scrollAfterRow: 7,
								urls: [
									// "https://netflixtechblog.com/feed",
									"https://www.blef.fr/blog/rss/",
									"https://www.theseattledataguy.com/feed/",
									"https://blog.cloudflare.com/rss/",
									"https://eng.uber.com/rss/",
									// "https://aws.amazon.com/blogs/big-data/feed/",
								],
							},
						],
					},
				],
			},
			{
				title: "Sports",
				path: "/sports",
				columns: [
					{
						size: 2,
						widgets: [],
					},
					{
						size: 7,
						widgets: [
							{
								type: "youtube",
								channels: [
									"@skysportspremierleague",
									"@chelseafc",
									"@YounesTalksFootball",
								],
							},
						],
					},
				],
			},
		],
	},
});

export const SKELETON_CONFIG = toSkeletonConfig(DEFAULT_CONFIG);
export const APP_CONFIG_JSONSCHEMA = zodToJsonSchema(AppConfigSchema);
