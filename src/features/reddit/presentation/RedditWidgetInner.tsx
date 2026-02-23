import { memo } from "react";
import { z } from "zod";
import { RedditWidgetConfigSchema } from "../infrastructure/config.schemas";
import { RedditPostListSchema } from "../domain/entities/post";
import { CardContent, Typography, Card, Divider, Link } from "@mui/material";

export const RedditWidgetInnerPropsSchema = z.object({
	config: RedditWidgetConfigSchema,
	posts: RedditPostListSchema,
});

export type RedditWidgetInnerProps = z.infer<
	typeof RedditWidgetInnerPropsSchema
>;

export const RedditWidgetInner = memo(function RedditWidgetInner({
	config,
	posts,
}: RedditWidgetInnerProps) {
	return (
		<Card>
			{!config.hideTitle && (
				<Typography variant="h6">r/{config.subreddit}</Typography>
			)}
			{posts.map((post) => (
				<div key={post.id}>
					<Link
						href={post.url}
						target="_blank"
						rel="noopener noreferrer"
						underline="none"
						color="inherit"
					>
						<CardContent
							sx={{
								paddingLeft: 1,
								paddingTop: 1,
								paddingBottom: 1,
								cursor: "pointer",
								"&:hover": {
									backgroundColor: "rgba(0, 0, 0, 0.04)",
								},
							}}
						>
							<Typography
								variant="subtitle1"
								sx={{
									color: "text.primary",
									fontWeight: 500,
								}}
							>
								{post.title}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{
									new Date(post.created * 1000)
										.toISOString()
										.split("T")[0]
								}{" "}
								• u/{post.author} • {post.score} points •{" "}
								{post.numComments} comments
							</Typography>
							{post.selftext && (
								<Typography variant="body2" sx={{ mt: 0.5 }}>
									{post.selftext.length > 150
										? post.selftext.substring(0, 150) + "..."
										: post.selftext}
								</Typography>
							)}
						</CardContent>
					</Link>
					<Divider />
				</div>
			))}
		</Card>
	);
});
