import { memo } from "react";
import { Feed } from "../domain/entities/feed";
import {
	Card,
	CardHeader,
	CardMedia,
	Typography,
	Chip,
	Stack,
	Link,
	Box,
	useTheme,
	useMediaQuery,
} from "@mui/material";

export type FeedItemProps = Feed;

export const FeedItem = memo(function FeedItem({
	title,
	feedUrl,
	thumbnailUrl,
	publishedAt,
	description,
	categories,
	source,
	author,
}: FeedItemProps) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const formattedDate = new Date(publishedAt).toISOString().split("T")[0];
	const thumbnailSize = isMobile ? 80 : 130;

	return (
		<Card
			sx={{
				maxWidth: "100%",
				boxShadow: 0,
				marginBottom: 0.5,
				marginTop: 0.5,
				"&:hover": {
					boxShadow: 4,
				},
			}}
			title={title}
		>
			<Link href={feedUrl} underline="none" color="inherit">
				<Box sx={{ display: "flex" }}>
					{thumbnailUrl && (
						<Box
							sx={{
								width: thumbnailSize,
								height: thumbnailSize,
								flexShrink: 0,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								padding: 1,
							}}
						>
							<CardMedia
								component="img"
								image={thumbnailUrl}
								alt={title}
								sx={{
									width: "100%",
									height: "100%",
									objectFit: "cover",
								}}
							/>
						</Box>
					)}
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<CardHeader
							title={
								<Typography
									variant={isMobile ? "body1" : "h6"}
									sx={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										display: "-webkit-box",
										WebkitLineClamp: 2,
										WebkitBoxOrient: "vertical",
									}}
								>
									{title}
								</Typography>
							}
							sx={{ p: 1 }}
						/>
						<Box sx={{ py: 1, px: 1 }}>
							<Typography
								variant={isMobile ? "caption" : "subtitle2"}
								color="text.secondary"
								gutterBottom
							>
								{`${formattedDate} • ${source}${author ? ` • ${author}` : ""
									}`}
							</Typography>
							{description && (
								<Typography
									variant={isMobile ? "caption" : "body2"}
									color="text.secondary"
									gutterBottom
									sx={{
										overflow: "hidden",
										textOverflow: "ellipsis",
										display: "-webkit-box",
										WebkitLineClamp: 2,
										WebkitBoxOrient: "vertical",
									}}
								>
									{description}
								</Typography>
							)}
							{categories.length > 0 && (
								<Stack
									direction="row"
									spacing={0.5}
									sx={{
										flexWrap: "wrap",
										gap: 0.5,
									}}
								>
									{categories.map((category, index) => (
										<Chip
											key={index}
											label={category}
											size="small"
											sx={{
												height: isMobile ? 20 : 24,
												fontSize: isMobile
													? "0.625rem"
													: "0.75rem",
											}}
										/>
									))}
								</Stack>
							)}
						</Box>
					</Box>
				</Box>
			</Link>
		</Card>
	);
});
