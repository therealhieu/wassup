import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { YoutubeWidgetInner } from "./YoutubeWidgetInner";

const meta: Meta<typeof YoutubeWidgetInner> = {
	component: YoutubeWidgetInner,
	title: "features/youtube/YoutubeWidgetInner",
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof YoutubeWidgetInner>;

export const Default: Story = {
	args: {
		videos: [
			{
				id: "yt:video:9KUC_nHydZg",
				title: "Harmful Content Detection / Content Moderation | ML System Design Problem Breakdown",
				url: "https://www.youtube.com/watch?v=9KUC_nHydZg",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i2.ytimg.com/vi/9KUC_nHydZg/hqdefault.jpg",
				views: 5168,
				publishedAt: new Date("2025-05-04T16:00:10.000Z"),
			},
			{
				id: "yt:video:7-6F3b14baA",
				title: "API Gateways in System Design Interviews w/ Ex-Meta Staff Engineer",
				url: "https://www.youtube.com/watch?v=7-6F3b14baA",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i4.ytimg.com/vi/7-6F3b14baA/hqdefault.jpg",
				views: 26978,
				publishedAt: new Date("2025-04-17T23:54:06.000Z"),
			},
			{
				id: "yt:video:nJsVO84LCGs",
				title: "How to Learn System Design with Jordan Has No Life",
				url: "https://www.youtube.com/watch?v=nJsVO84LCGs",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i3.ytimg.com/vi/nJsVO84LCGs/hqdefault.jpg",
				views: 18539,
				publishedAt: new Date("2025-03-13T20:35:00.000Z"),
			},
			{
				id: "yt:video:IUrQ5_g3XKs",
				title: "System Design Interview: Design YouTube w/ a Ex-Meta Staff Engineer",
				url: "https://www.youtube.com/watch?v=IUrQ5_g3XKs",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i2.ytimg.com/vi/IUrQ5_g3XKs/hqdefault.jpg",
				views: 50094,
				publishedAt: new Date("2025-03-09T16:00:30.000Z"),
			},
			{
				id: "yt:video:SHkbPm1Wrno",
				title: "Networking Essentials for System Design Interviews",
				url: "https://www.youtube.com/watch?v=SHkbPm1Wrno",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i4.ytimg.com/vi/SHkbPm1Wrno/hqdefault.jpg",
				views: 49540,
				publishedAt: new Date("2025-03-02T17:00:26.000Z"),
			},
			{
				id: "yt:video:vccwdhfqIrI",
				title: "Consistent Hashing: Easy Explanation",
				url: "https://www.youtube.com/watch?v=vccwdhfqIrI",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i3.ytimg.com/vi/vccwdhfqIrI/hqdefault.jpg",
				views: 29332,
				publishedAt: new Date("2025-02-20T23:00:54.000Z"),
			},
			{
				id: "yt:video:IgyU0iFIoqM",
				title: "Data Structures for Big Data in Interviews - Bloom Filters, Count-Min Sketch, HyperLogLog",
				url: "https://www.youtube.com/watch?v=IgyU0iFIoqM",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i2.ytimg.com/vi/IgyU0iFIoqM/hqdefault.jpg",
				views: 19044,
				publishedAt: new Date("2025-02-15T17:00:18.000Z"),
			},
			{
				id: "yt:video:BHCSL_ZifI0",
				title: "DB Indexing in System Design Interviews - B-tree, Geospatial, Inverted Index, and more!",
				url: "https://www.youtube.com/watch?v=BHCSL_ZifI0",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i3.ytimg.com/vi/BHCSL_ZifI0/hqdefault.jpg",
				views: 45067,
				publishedAt: new Date("2025-02-09T17:00:09.000Z"),
			},
			{
				id: "yt:video:bBvPQZmPXwQ",
				title: "Behavioral Interview Discussion with Ex-Meta Hiring Committee Member",
				url: "https://www.youtube.com/watch?v=bBvPQZmPXwQ",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i3.ytimg.com/vi/bBvPQZmPXwQ/hqdefault.jpg",
				views: 47567,
				publishedAt: new Date("2025-02-04T21:00:24.000Z"),
			},
			{
				id: "yt:video:GncgOIiMII8",
				title: "Recommendation System Infra Basics 1",
				url: "https://www.youtube.com/watch?v=GncgOIiMII8",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i4.ytimg.com/vi/GncgOIiMII8/hqdefault.jpg",
				views: 19901,
				publishedAt: new Date("2025-01-26T21:30:01.000Z"),
			},
			{
				id: "yt:video:2X2SO3Y-af8",
				title: "DynamoDB Deep Dive w/ a Ex-Meta Staff Engineer",
				url: "https://www.youtube.com/watch?v=2X2SO3Y-af8",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i3.ytimg.com/vi/2X2SO3Y-af8/hqdefault.jpg",
				views: 37717,
				publishedAt: new Date("2025-01-23T16:00:04.000Z"),
			},
			{
				id: "yt:video:FbEKrBcrLiI",
				title: "Live Q&A with FAANG Engineers and Managers 2025/01/16",
				url: "https://www.youtube.com/watch?v=FbEKrBcrLiI",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i3.ytimg.com/vi/FbEKrBcrLiI/hqdefault.jpg",
				views: 5071,
				publishedAt: new Date("2025-01-17T13:42:04.000Z"),
			},
			{
				id: "yt:video:tIvCjH2ETzo",
				title: "SQL vs NoSQL is the WRONG Question (System Design Tips)",
				url: "https://www.youtube.com/watch?v=tIvCjH2ETzo",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i1.ytimg.com/vi/tIvCjH2ETzo/hqdefault.jpg",
				views: 34810,
				publishedAt: new Date("2025-01-16T03:08:58.000Z"),
			},
			{
				id: "yt:video:LjLx0fCd1k8",
				title: "System Design Interview: Design Live Comments w/ a Ex-Meta Staff Engineer",
				url: "https://www.youtube.com/watch?v=LjLx0fCd1k8",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i1.ytimg.com/vi/LjLx0fCd1k8/hqdefault.jpg",
				views: 45781,
				publishedAt: new Date("2025-01-12T16:00:30.000Z"),
			},
			{
				id: "yt:video:cr6p0n0N-VA",
				title: "System Design Interview: Design Whatsapp w/ a Ex-Meta Senior Manager",
				url: "https://www.youtube.com/watch?v=cr6p0n0N-VA",
				authorName: "Hello Interview - SWE Interview Preparation",
				authorUrl:
					"https://www.youtube.com/channel/UC3kf-QFT6FZzDk9JsPg8Svg",
				thumbnailUrl:
					"https://i4.ytimg.com/vi/cr6p0n0N-VA/hqdefault.jpg",
				views: 74144,
				publishedAt: new Date("2024-12-20T19:00:21.000Z"),
			},
		],
	},
};
