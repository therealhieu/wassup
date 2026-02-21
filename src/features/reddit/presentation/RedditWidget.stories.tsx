import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RedditWidgetInner } from "./RedditWidgetInner";

const meta: Meta<typeof RedditWidgetInner> = {
	title: "features/reddit/RedditWidget",
	component: RedditWidgetInner,
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RedditWidgetInner>;

export const Default: Story = {
	args: {
		config: {
			type: "reddit",
			subreddit: "typescript",
			hideTitle: false,
			sort: "hot",
			limit: 10,
		},
		posts: [
			{
				id: "1kbv9mr",
				title: "Who's hiring Typescript developers May",
				author: "PUSH_AX",
				subreddit: "typescript",
				selftext:
					"The monthly thread for people to post openings at their companies.\n\n&amp;#x200B;\n\n\\* Please state the job location and include the keywords REMOTE, INTERNS and/or VISA when the corresponding sort of candidate is welcome. When remote work is not an option, include ONSITE.\n\n&amp;#x200B;\n\n\\* Please only post if you personally are part of the hiring company—no recruiting firms or job boards \\*\\*Please report recruiters or job boards\\*\\*. \n\n&amp;#x200B;\n\n\\* Only one post per company. \n\n&amp;#x200B;\n\n\\* If it isn't a household name, explain what your company does. Sell it.\n\n&amp;#x200B;\n\n\\* Please add the company email that applications should be sent to, or the companies application web form/job posting (needless to say this should be on the company website, not a third party site).\n\n&amp;#x200B;\n\n&amp;#x200B;\n\nCommenters: please don't reply to job posts to complain about something. It's off topic here.\n\n&amp;#x200B;\n\nReaders: please only email if you are personally interested in the job. \n\n&amp;#x200B;\n\nPosting top level comments that aren't job postings, \\[that's a paddlin\\]([https://i.imgur.com/FxMKfnY.jpg](https://i.imgur.com/FxMKfnY.jpg))",
				url: "https://www.reddit.com/r/typescript/comments/1kbv9mr/whos_hiring_typescript_developers_may/",
				permalink:
					"/r/typescript/comments/1kbv9mr/whos_hiring_typescript_developers_may/",
				score: 20,
				upvoteRatio: 0.92,
				numComments: 4,
				created: 1746057650,
				thumbnail: "self",
				isVideo: false,
				isNSFW: false,
				isSpoiler: false,
				isLocked: false,
				isPinned: false,
			},
			{
				id: "1khmtry",
				title: "Are there any benefits of outputting your *internal* NPM package in pure TS?",
				author: "ignite-me",
				subreddit: "typescript",
				selftext:
					"In my team, we are currently considering whether we should output our internal component library as pure TS instead of pre-compiling it as JavaScript with type declaration files.\n\nWe are an organization that is all-TS and this won't change in the coming years. Are there any real benefits to this approach?\n\nMy understanding is that if a pure TS package is imported into a project and (React) components are consumed from it, it will require extra config to ensure that TS files from node\\_modules folder is compiled. The consumers of this lib are generally using Webpack as their bundler of choice.\n\n  \nDoes anyone have any experience with something like this before?\n\n  \nThank you 🙏",
				url: "https://www.reddit.com/r/typescript/comments/1khmtry/are_there_any_benefits_of_outputting_your/",
				permalink:
					"/r/typescript/comments/1khmtry/are_there_any_benefits_of_outputting_your/",
				score: 9,
				upvoteRatio: 0.77,
				numComments: 10,
				created: 1746700454,
				thumbnail: "self",
				isVideo: false,
				isNSFW: false,
				isSpoiler: false,
				isLocked: false,
				isPinned: false,
			},
			{
				id: "1khtbqa",
				title: "Better to grouping the export function for tree shaking",
				author: "PayKunGz",
				subreddit: "typescript",
				selftext:
					'Currently I use barrel export for grouping the module question \nfor example\n```typescript\n// func.ts\nexport function a() {};\nexport function b() {};\n-------\n// index.ts\nexport * as Func from "./func.ts"\n-----\nusing.ts\nimport Func from "./"\nFunc.a();\n```\nis this a good approach on grouping the function and tree shaking?\n\nanother way I think of is export as object literal \n```typescript\nfunction a() {};\nfunction b() {};\n\nexport default { a, b } as Func; // idk is this right syntax\n```',
				url: "https://www.reddit.com/r/typescript/comments/1khtbqa/better_to_grouping_the_export_function_for_tree/",
				permalink:
					"/r/typescript/comments/1khtbqa/better_to_grouping_the_export_function_for_tree/",
				score: 3,
				upvoteRatio: 1,
				numComments: 4,
				created: 1746719066,
				thumbnail: "self",
				isVideo: false,
				isNSFW: false,
				isSpoiler: false,
				isLocked: false,
				isPinned: false,
			},
			{
				id: "1khkj3x",
				title: "Powerful ESLint plugin with rules to help you achieve a scalable, consistent, and well-structured project.",
				author: "jamnik666",
				subreddit: "typescript",
				selftext:
					"Hey everyone! I’d like to show you the latest version of my library.\n\nThe mission of the library is to enhance the quality, scalability, and consistency of projects within the JavaScript/TypeScript ecosystem.\n\nJoin the community, propose or vote on new ideas, and discuss project structures across various frameworks!\n\n# 📁🦉[eslint-plugin-project-structure](https://github.com/Igorkowalski94/eslint-plugin-project-structure/wiki/Plugin-homepage#root)\n\nPowerful ESLint plugin with rules to help you achieve a scalable, consistent, and well-structured project.\n\nCreate your own framework! Define your folder structure, file composition, advanced naming conventions, and create independent modules.\n\nTake your project to the next level and save time by automating the review of key principles of a healthy project!",
				url: "https://www.reddit.com/r/typescript/comments/1khkj3x/powerful_eslint_plugin_with_rules_to_help_you/",
				permalink:
					"/r/typescript/comments/1khkj3x/powerful_eslint_plugin_with_rules_to_help_you/",
				score: 9,
				upvoteRatio: 0.85,
				numComments: 1,
				created: 1746690612,
				thumbnail: "self",
				isVideo: false,
				isNSFW: false,
				isSpoiler: false,
				isLocked: false,
				isPinned: false,
			},
			{
				id: "1khbmqc",
				title: "Help with typescript inference: combining the return type of a generic callback function",
				author: "bzbub2",
				subreddit: "typescript",
				selftext:
					'Here is a typescript playground, where i\'m trying to merge the results of a callback with another object\n\nhttps://www.typescriptlang.org/play/?#code/PTAEEsDtQWwT1AQwA7IDbgMaIC7gPaQBcAsAFAigAqEAzqAEaK1aJpoICm4OAFpwCckoAEqdM+AQBMAPLRwCoAcwA0AV0gBrSPgDukAHyhJoDVM4AzKJynkLGzHkKgp+AMo41FizKoGAFBZoiEpEjPj4aJyIkCqg2OxMmJph-gCUoAC8RlQZAN7koPGE8qACnDhZ8WxoSZrpANyFEBaggcFK+c1F5Z4C0AVkRcOgyLi8AIJhAIwq3cMAdEu9c0PDAL5Na+ugnGi0nKCDI71q-UfzRWN8AEJhAEyrI0VLCyvzm83r5N9k5OQSSClcq0NRoHDTKquDxeCz+BRqThxdJZIzHYpAyKcBZofBKfzzABErnksIgkAAbvhsE5INNCU9QGktj0KmcBvMAF5hADMjM+ZHWzP+ZEBpUgnF0fGUkMyFzWEt0YlB4LCCKRzVeILBELilBqoCsEqQkCkoCUEVsgq2AJKlW14PuUPcnm88IEiORGWy8qKYqxOLxBLWRUJDpwTvA9BwcGQhwlFMEDOawrWp3OZks1ikWyFNtFdtAiulkCUTrl6MVyp1ao9GrWWs4KojerAggEkjC4cj9HwrRjcaLnETAh+WyAA\n\nIs there any way to fix this? either with explicit or inferred return type is fine. if needed i\'m gonna break my API and just not spread the callbackReturn object onto the result...\n\ncopy of code\n\n    // in my application:\n    // T is basically either a Record&lt;string,unknown&gt; or undefined\n    function doStuff&lt;T&gt;(flag: boolean, callback: () =&gt; T) {\n      const callbackReturn = callback();\n      if (flag) {\n        return {\n          pathA: 1,\n          ...callbackReturn,\n        };\n      } else {\n        return {\n          pathB: 2,\n          ...callbackReturn,\n        };\n      }\n    }\n    \n    \n    const result1 = doStuff(true, () =&gt; {\n      console.log(\n        "dostuff invocation1",\n      );\n      return {\n        z: 3,\n      };\n    });\n    \n    const newthing1 = {\n      newResult: true,\n      ...result1, // all fine and good\n    };\n    \n    const result2 = doStuff(true, () =&gt; {\n      console.log(\n        "result2 is type never",\n      );\n      return undefined;\n    });\n    \n    const newthing2 = {\n      newResult: true,\n      ...result2, // error: result2 is of type never\n    };\n    \n    ',
				url: "https://www.reddit.com/r/typescript/comments/1khbmqc/help_with_typescript_inference_combining_the/",
				permalink:
					"/r/typescript/comments/1khbmqc/help_with_typescript_inference_combining_the/",
				score: 6,
				upvoteRatio: 0.88,
				numComments: 17,
				created: 1746659964,
				thumbnail: "self",
				isVideo: false,
				isNSFW: false,
				isSpoiler: false,
				isLocked: false,
				isPinned: false,
			},
		],
	},
};
