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
												"https://www.startdataengineering.com",
												"https://github.com/DataEngineer-io/data-engineer-handbook",
												"https://docs.getdbt.com",
												"https://iceberg.apache.org/docs/latest",
												"https://duckdb.org/docs",
												"https://use-the-index-luke.com",
											],
										},
										{
											title: "AI",
											bookmarks: [
												"https://github.com/e2b-dev/awesome-ai-agents",
												"https://github.com/Shubhamsaboo/awesome-llm-apps",
												"https://github.com/NirDiamant/RAG_Techniques",
												"https://github.com/NirDiamant/GenAI_Agents",
												"https://python.langchain.com/docs",
												"https://docs.llamaindex.ai",
												"https://paperswithcode.com",
												"https://huggingface.co/papers",
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
										"Data Engineering",
										"DataOps",
										"Database",
										"Rust",
										"AI",
										"Interview / Jobs",
									],
									tabs: [
										{
											type: "multisourcenews",
											hackernews: { type: "hackernews", query: "data engineering OR data pipeline OR data platform", sort: "new", limit: 20, hideTitle: true },
											lobsters: { type: "lobsters", tag: "devops", sort: "hottest", limit: 20, hideTitle: true },
											devto: { type: "devto", tags: ["dataengineering", "data"], top: "7", limit: 20, hideTitle: true },
											scrollAfterRow: 7,
										},
										{
											type: "multisourcenews",
											hackernews: { type: "hackernews", query: "DataOps OR data quality OR data observability", sort: "new", limit: 20, hideTitle: true },
											lobsters: { type: "lobsters", tag: "devops", sort: "hottest", limit: 20, hideTitle: true },
											devto: { type: "devto", tags: ["devops", "datascience"], top: "7", limit: 20, hideTitle: true },
											scrollAfterRow: 7,
										},
										{
											type: "multisourcenews",
											hackernews: { type: "hackernews", query: "database OR SQL OR distributed system", sort: "new", limit: 20, hideTitle: true },
											lobsters: { type: "lobsters", tag: "databases", sort: "hottest", limit: 20, hideTitle: true },
											devto: { type: "devto", tags: ["database", "sql"], top: "7", limit: 20, hideTitle: true },
											scrollAfterRow: 7,
										},
										{
											type: "multisourcenews",
											hackernews: { type: "hackernews", query: "rust lang OR rust", sort: "new", limit: 20, hideTitle: true },
											lobsters: { type: "lobsters", tag: "rust", sort: "hottest", limit: 20, hideTitle: true },
											devto: { type: "devto", tags: ["rust"], top: "7", limit: 20, hideTitle: true },
											scrollAfterRow: 7,
										},
										{
											type: "multisourcenews",
											hackernews: { type: "hackernews", query: "LLM OR AI agent OR RAG OR large language model", sort: "new", limit: 20, hideTitle: true },
											lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
											devto: { type: "devto", tags: ["ai", "machinelearning", "llm"], top: "7", limit: 20, hideTitle: true },
											scrollAfterRow: 7,
										},
										{
											type: "multisourcenews",
											hackernews: { type: "hackernews", query: "data engineer job OR data engineer interview prep", sort: "new", limit: 20, hideTitle: true },
											lobsters: { type: "lobsters", tag: "job", sort: "hottest", limit: 20, hideTitle: true },
											devto: { type: "devto", tags: ["career", "interview"], top: "7", limit: 20, hideTitle: true },
											scrollAfterRow: 7,
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
										type: "bookmark",
										title: "Dev Resources",
										groups: [

											{
												title: "System Design",
												bookmarks: [
													"https://www.hellointerview.com",
													"https://github.com/ashishps1/awesome-system-design-resources",
													"https://github.com/donnemartin/system-design-primer",
													"https://highscalability.com",
												],
											},
											{
												title: "Design Patterns",
												bookmarks: [
													"https://refactoring.guru/design-patterns",
													"https://www.patterns.dev",
													"https://github.com/kamranahmedse/design-patterns-for-humans",
												],
											},
											{
												title: "Distributed Systems",
												bookmarks: [
													"https://martinfowler.com/articles/patterns-of-distributed-systems",
													"https://github.com/theanalyst/awesome-distributed-systems",
													"https://jepsen.io",
												],
											},
											{
												title: "Database",
												bookmarks: [
													"https://use-the-index-luke.com",
													"https://www.db-engines.com/en/ranking",
													"https://duckdb.org/docs",
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
											"Programming",
											"System Design",
											"Distributed Systems",
											"Database",
											"Platform",
										],
										tabs: [
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "programming OR software engineering", sort: "new", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "programming", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["programming", "webdev", "softwareengineering"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "system design OR scalability OR architecture", sort: "new", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "scaling", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["architecture", "systemdesign"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "distributed systems OR consensus OR microservices", sort: "new", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "distributed", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["distributedsystems", "microservices"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "database OR SQL OR postgres OR distributed database", sort: "new", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "databases", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["database", "sql", "postgres"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "kubernetes OR k8s OR docker OR platform engineering", sort: "new", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "devops", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["kubernetes", "docker", "devops"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
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
											"System Design",
											"Platform / Infra",
											"Database",
										],
										tabs: [
											{
												type: "github",
												topics: [
													"system-design",
													"distributed-systems",
													"architecture",
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
											{
												type: "github",
												topics: [
													"postgresql",
													"distributed-database",
													"database",
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
											"AI",
											"LLMs",
											"Agents",
											"RAG",
											"AIOps",
										],
										tabs: [
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "artificial intelligence OR AI", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["ai", "machinelearning"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "LLM OR large language model OR GPT", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["ai", "llm", "gpt"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "AI agent OR agentic OR multi-agent", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["ai", "llm"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "RAG OR retrieval augmented generation OR vector database", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["ai", "llm"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "MLOps OR AIOps OR model serving OR LLM inference", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["mlops", "ai"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
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
											"Data Science",
											"ML",
											"Statistics",
											"Data Analysis",
											"Data Viz",
										],
										tabs: [
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "data science", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["datascience"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "machine learning", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["machinelearning"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "statistics OR statistical", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "math", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["datascience", "math"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "data analysis", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["datascience", "data"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "data visualization", sort: "top", limit: 20, hideTitle: true },
												lobsters: { type: "lobsters", tag: "visualization", sort: "hottest", limit: 20, hideTitle: true },
												devto: { type: "devto", tags: ["datascience", "datavisualization"], top: "7", limit: 20, hideTitle: true },
												scrollAfterRow: 7,
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
											"Deep Learning",
											"NLP",
											"Kaggle",
										],
										tabs: [
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "deep learning OR neural network", sort: "top", limit: 8, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 8, hideTitle: true },
												devto: { type: "devto", tags: ["deeplearning", "machinelearning"], top: "7", limit: 8, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "NLP OR language model", sort: "top", limit: 8, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 8, hideTitle: true },
												devto: { type: "devto", tags: ["ai", "nlp"], top: "7", limit: 8, hideTitle: true },
												scrollAfterRow: 7,
											},
											{
												type: "multisourcenews",
												hackernews: { type: "hackernews", query: "kaggle OR competition", sort: "top", limit: 8, hideTitle: true },
												lobsters: { type: "lobsters", tag: "ai", sort: "hottest", limit: 8, hideTitle: true },
												devto: { type: "devto", tags: ["machinelearning", "datascience"], top: "7", limit: 8, hideTitle: true },
												scrollAfterRow: 7,
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

export const SEED_PRESET_IDS = new Set(SEED_PRESETS.map((p) => p.id));
export function isSeedPreset(id: string): boolean {
	return SEED_PRESET_IDS.has(id);
}
