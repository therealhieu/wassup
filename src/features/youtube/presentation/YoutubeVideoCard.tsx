import { YoutubeVideo } from "../domain/entities/video";
import { Card, CardContent, Typography } from "@mui/material";
import Image from "next/image";
import Link from "next/link";

type YoutubeVideoCardProps = YoutubeVideo;
export const YoutubeVideoCard = (props: YoutubeVideoCardProps) => {
	const { title, url, thumbnailUrl, authorName, views, publishedAt } = props;
	return (
		<Card
			sx={{
				p: 2,
				"&:hover": {
					boxShadow: 6,
				},
				height: "100%",
			}}
		>
			<Link href={url}>
				<Image
					src={thumbnailUrl}
					alt={title}
					width={320}
					height={180}
					priority
					style={{ borderRadius: 4, width: "100%", height: "auto" }}
					quality={100}
				/>
			</Link>
			<CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
				<Link href={url}>
					<Typography
						variant="subtitle1"
						sx={{
							fontWeight: 500,
							mb: 0.5, // Smaller bottom margin instead of default gutterBottom
							lineHeight: 1.2, // Tighter line height for less gap between lines
						}}
					>
						{title}
					</Typography>
				</Link>
				<Typography
					variant="subtitle2"
					color="text.secondary"
					sx={{
						overflow: "hidden",
						textOverflow: "ellipsis",
						whiteSpace: "nowrap",
					}}
				>
					<div>
						<div>
							{authorName.length > 20
								? authorName.slice(0, 20) + "..."
								: authorName}
						</div>
						<div>
							{publishedAt.toLocaleDateString("en-CA")} •{" "}
							{views.toLocaleString()} views
						</div>
					</div>
				</Typography>
			</CardContent>
		</Card>
	);
};
