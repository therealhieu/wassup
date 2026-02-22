import {
	type Preset,
	AppConfigSchema,
} from "@/infrastructure/config.schemas";

export const SEED_PRESETS: Preset[] = [
	{
		id: "hieu",
		name: "Hieu's Preset",
		config: AppConfigSchema.parse({
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
												bookmarks: [
													"https://www.neetcode.io",
												],
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
											"https://www.blef.fr/blog/rss/",
											"https://www.theseattledataguy.com/feed/",
											"https://blog.cloudflare.com/rss/",
											"https://eng.uber.com/rss/",
										],
									},
								],
							},
						],
					},
					{
						title: "AI",
						path: "/ai",
						columns: [
							{
								size: 12,
								widgets: [
									{
										type: "github",
										topics: [
											"llm",
											"ai-agents",
											"rag",
											"machine-learning",
										],
										createdAfter: "2024-01-01",
										dateRange: "90d",
										limit: 30,
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
		}),
	},
	{
		id: "general-swe",
		name: "Software Engineer",
		config: AppConfigSchema.parse({
			ui: {
				theme: "dark",
				pages: [
					{
						title: "Home",
						path: "/",
						columns: [
							{
								size: 3,
								widgets: [
									{
										type: "weather",
										location: "San Francisco",
									},
									{
										type: "bookmark",
										title: "Dev Resources",
										groups: [
											{
												title: "References",
												bookmarks: [
													"https://devdocs.io",
													"https://developer.mozilla.org",
												],
											},
											{
												title: "Tools",
												bookmarks: [
													"https://github.com",
													"https://stackoverflow.com",
												],
											},
										],
									},
								],
							},
							{
								size: 6,
								widgets: [
									{
										type: "tabs",
										labels: [
											"r/programming",
											"r/webdev",
											"r/typescript",
										],
										tabs: [
											{
												type: "reddit",
												subreddit: "programming",
												hideTitle: true,
												sort: "new",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "webdev",
												hideTitle: true,
												sort: "new",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "typescript",
												hideTitle: true,
												sort: "new",
												limit: 5,
											},
										],
									},
									{
										type: "youtube",
										channels: [
											"@Fireship",
											"@ThePrimeTimeagen",
											"@t3dotgg",
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
										urls: [
											"https://blog.cloudflare.com/rss/",
											"https://engineering.fb.com/feed/",
											"https://netflixtechblog.com/feed",
										],
									},
								],
							},
						],
					},
				],
			},
		}),
	},
	{
		id: "blank",
		name: "Blank",
		config: AppConfigSchema.parse({
			ui: {
				theme: "light",
				pages: [
					{
						title: "Home",
						path: "/",
						columns: [{ size: 12, widgets: [] }],
					},
				],
			},
		}),
	},
];

export const BLANK_CONFIG = SEED_PRESETS.find((p) => p.id === "blank")!.config;
