import {
	type Preset,
	AppConfigSchema,
} from "@/infrastructure/config.schemas";

export const DATA_ENGINEERING_PRESET: Preset = {
	id: "data-engineering",
	name: "Data Engineering",
	config: AppConfigSchema.parse({
		ui: {
			theme: "light",
			pages: [
				{
					title: "Home",
					path: "/",
					columns: [
						{
							size: 3,
							widgets: [
								{
									type: "hackernews",
									sort: "top",
									limit: 10,
									query: "data engineering OR AI OR platform OR infrastructure",
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
							size: 6,
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
					title: "trends",
					path: "/trends",
					columns: [
						{
							size: 12,
							widgets: [
							{
								type: "tabs",
								labels: ["AI", "Data Engineering", "Rust","Platform", "Tools"],
								tabs: [
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
									{
										type: "github",
										topics: [
											"apache-spark",
											"apache-kafka",
											"apache-airflow",
											"data-engineering",
											"data"
										],
										createdAfter: "2024-01-01",
										dateRange: "90d",
										limit: 30,
									},
									{
										type: "github",
										topics: [
											"rust",
										],
										createdAfter: "2024-01-01",
										dateRange: "90d",
										limit: 30,
									},
									{
										type: "github",
										topics: [
											"kubernetes",
											"terraform",
											"platform-engineering",
											"infrastructure-as-code",
										],
										createdAfter: "2024-01-01",
										dateRange: "90d",
										limit: 30,
									},
									{
										type: "github",
										topics: [
											"cli",
											"developer-tools",
											"devops",
											"command-line-tool",
										],
										createdAfter: "2024-01-01",
										dateRange: "90d",
										limit: 30,
									},
								],
							},
						],
						},
					],
				},
			],
		},
	}),
};

export const SEED_PRESETS: Preset[] = [
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
					{
						title: "Trends",
						path: "/trends",
						columns: [
							{
								size: 12,
								widgets: [
									{
										type: "tabs",
										labels: [
											"AI / LLM",
											"Platform",
										],
										tabs: [
											{
												type: "github",
												topics: [
													"llm",
													"ai-agents",
													"rag",
													"generative-ai",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
											{
												type: "github",
												topics: [
													"kubernetes",
													"docker",
													"platform-engineering",
													"infrastructure",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
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
	DATA_ENGINEERING_PRESET,
	{
		id: "ai-engineering",
		name: "AI Engineering",
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
										type: "bookmark",
										title: "AI Engineering",
										groups: [
											{
												title: "Frameworks",
												bookmarks: [
													"https://python.langchain.com/docs",
													"https://docs.llamaindex.ai",
													"https://huggingface.co",
													"https://sdk.vercel.ai/docs",
												],
											},
											{
												title: "Project Ideas",
												bookmarks: [
													"https://github.com/NirDiamant/GenAI_Agents",
													"https://github.com/e2b-dev/awesome-ai-agents",
													"https://github.com/mlabonne/llm-course",
													"https://github.com/chiphuyen/aie-book",
												],
											},
											{
												title: "MLOps & Eval",
												bookmarks: [
													"https://smith.langchain.com",
													"https://wandb.ai",
													"https://langfuse.com",
													"https://ollama.com",
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
											"r/LocalLLaMA",
											"r/MachineLearning",
											"r/artificial",
											"r/LLMDevs",
											"r/singularity",
										],
										tabs: [
											{
												type: "reddit",
												subreddit: "LocalLLaMA",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "MachineLearning",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "artificial",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "LLMDevs",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "singularity",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
										],
									},
									{
										type: "youtube",
										channels: [
											"@AndrejKarpathy",
											"@YannicKilcher",
											"@aiexplained-official",
											"@LatentSpacePod",
											"@stanfordonline",
											"@Fireship",
										],
									},
								],
							},
							{
								size: 3,
								widgets: [
									{
										type: "feed",
										limit: 12,
										scrollAfterRow: 7,
										urls: [
											"https://lilianweng.github.io/index.xml",
											"https://simonwillison.net/atom/everything",
											"https://huyenchip.com/feed",
											"https://www.latent.space/feed",
										],
									},
								],
							},
						],
					},
					{
						title: "Research",
						path: "/research",
						columns: [
							{
								size: 5,
								widgets: [
									{
										type: "hackernews",
										sort: "top",
										limit: 15,
										query: "LLM OR large language model",
									},
									{
										type: "hackernews",
										sort: "show",
										limit: 10,
										query: "AI agent OR RAG",
									},
								],
							},
							{
								size: 7,
								widgets: [
									{
										type: "tabs",
										labels: [
											"r/LocalLLaMA",
											"r/LLMDevs",
											"r/PromptEngineering",
										],
										tabs: [
											{
												type: "reddit",
												subreddit: "LocalLLaMA",
												hideTitle: true,
												sort: "hot",
												limit: 8,
											},
											{
												type: "reddit",
												subreddit: "LLMDevs",
												hideTitle: true,
												sort: "hot",
												limit: 8,
											},
											{
												type: "reddit",
												subreddit: "PromptEngineering",
												hideTitle: true,
												sort: "hot",
												limit: 8,
											},
										],
									},
								],
							},
						],
					},
					{
						title: "Trends",
						path: "/trends",
						columns: [
							{
								size: 12,
								widgets: [
									{
										type: "tabs",
										labels: [
											"LLM / Agents",
											"RAG / Retrieval",
											"MLOps / Serving",
										],
										tabs: [
											{
												type: "github",
												topics: [
													"llm",
													"ai-agents",
													"langchain",
													"autogen",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
											{
												type: "github",
												topics: [
													"rag",
													"vector-database",
													"embeddings",
													"semantic-search",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
											{
												type: "github",
												topics: [
													"mlops",
													"model-serving",
													"llm-inference",
													"fine-tuning",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
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
		id: "data-science",
		name: "Data Science",
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
										type: "bookmark",
										title: "Data Science",
										groups: [
											{
												title: "Fundamentals",
												bookmarks: [
													"https://seeing-theory.brown.edu",
													"https://www.openintro.org/book/os/",
													"https://www.khanacademy.org/math/statistics-probability",
													"https://www.kaggle.com/learn",
													"https://github.com/ossu/data-science",
													"https://github.com/PavelGrigoryevDS/awesome-data-analysis",
												],
											},
											{
												title: "Job Preparation",
												bookmarks: [
													"https://datalemur.com",
													"https://www.stratascratch.com",
													"https://www.interviewquery.com",
													"https://www.tensortonic.com/problems",
													"https://github.com/chiphuyen/machine-learning-systems-design",
													"https://github.com/alexeygrigorev/data-science-interviews",
													"https://github.com/kojino/120-Data-Science-Interview-Questions",
												],
											},
											{
												title: "Trends",
												bookmarks: [
													"https://paperswithcode.com",
													"https://huggingface.co/papers",
													"https://www.stateof.ai",
													"https://github.com/academic/awesome-datascience",
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
											"r/datascience",
											"r/MachineLearning",
											"r/statistics",
											"r/dataanalysis",
											"r/dataisbeautiful",
										],
										tabs: [
											{
												type: "reddit",
												subreddit: "datascience",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "MachineLearning",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "statistics",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "dataanalysis",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
											{
												type: "reddit",
												subreddit: "dataisbeautiful",
												hideTitle: true,
												sort: "hot",
												limit: 5,
											},
										],
									},
									{
										type: "youtube",
										channels: [
											"@statquest",
											"@3blue1brown",
											"@AndrejKarpathy",
											"@TwoMinutePapers",
											"@AlexTheAnalyst",
											"@LukeBarousse",
										],
									},
								],
							},
							{
								size: 3,
								widgets: [
									{
										type: "feed",
										limit: 12,
										scrollAfterRow: 7,
										urls: [
											"https://towardsdatascience.com/feed",
											"https://machinelearningmastery.com/feed/",
											"https://simplystatistics.org/index.xml",
											"https://flowingdata.com/feed",
										],
									},
								],
							},
						],
					},
					{
						title: "Research",
						path: "/research",
						columns: [
							{
								size: 5,
								widgets: [
									{
										type: "hackernews",
										sort: "top",
										limit: 15,
										query: "machine learning",
									},
									{
										type: "hackernews",
										sort: "show",
										limit: 10,
										query: "data science",
									},
								],
							},
							{
								size: 7,
								widgets: [
									{
										type: "tabs",
										labels: [
											"r/deeplearning",
											"r/LanguageTechnology",
											"r/kaggle",
										],
										tabs: [
											{
												type: "reddit",
												subreddit: "deeplearning",
												hideTitle: true,
												sort: "hot",
												limit: 8,
											},
											{
												type: "reddit",
												subreddit: "LanguageTechnology",
												hideTitle: true,
												sort: "hot",
												limit: 8,
											},
											{
												type: "reddit",
												subreddit: "kaggle",
												hideTitle: true,
												sort: "hot",
												limit: 8,
											},
										],
									},
								],
							},
						],
					},
					{
						title: "Trends",
						path: "/trends",
						columns: [
							{
								size: 12,
								widgets: [
									{
										type: "tabs",
										labels: [
											"ML / Deep Learning",
											"Data Visualization",
											"EDA / Statistics",
										],
										tabs: [
											{
												type: "github",
												topics: [
													"machine-learning",
													"deep-learning",
													"pytorch",
													"transformers",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
											{
												type: "github",
												topics: [
													"data-visualization",
													"dashboard",
													"streamlit",
													"plotly",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
											{
												type: "github",
												topics: [
													"exploratory-data-analysis",
													"statistics",
													"pandas",
													"data-analysis",
												],
												createdAfter: "2024-01-01",
												dateRange: "90d",
												limit: 20,
											},
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
];

export const BLANK_CONFIG = AppConfigSchema.parse({
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
});
