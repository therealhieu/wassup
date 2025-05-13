import { z } from "zod";
import { YoutubeVideoSchema } from "../domain/entities/video";
import { YoutubeVideoCard } from "./YoutubeVideoCard";
import { Chip, Grid, Typography, Box } from "@mui/material";
import { YoutubeWidgetConfigSchema } from "../infrastructure/config.schemas";
import { YoutubeChannelSchema } from "../domain/entities/channel";
import { useState, useRef, useEffect } from "react";

export const YoutubeWidgetInnerPropsSchema = z.object({
	config: YoutubeWidgetConfigSchema,
	channels: z.array(YoutubeChannelSchema),
	videos: z.array(YoutubeVideoSchema),
});
export type YoutubeWidgetInnerProps = z.infer<
	typeof YoutubeWidgetInnerPropsSchema
>;

type ChipColor = "primary" | "secondary" | "success" | "info" | "warning";
const chipColors = [
	"primary",
	"secondary",
	"success",
	"info",
	"warning",
] as ChipColor[];

export const YoutubeWidgetInner = (props: YoutubeWidgetInnerProps) => {
	const { config, channels, videos } = props;
	const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
	const videosContainerRef = useRef<HTMLDivElement>(null);

	const currentChipColor = (index: number) => {
		return chipColors[index % chipColors.length];
	};

	const filteredVideos = selectedChannel
		? videos.filter((video) => video.authorUrl === selectedChannel)
		: videos;

	useEffect(() => {
		if (
			videosContainerRef.current &&
			filteredVideos.length > config.scrollAfterRow
		) {
			const rowHeight = 300; // Fixed height per row
			const totalRows = Math.ceil(config.scrollAfterRow);
			const scrollPosition = rowHeight * totalRows;

			videosContainerRef.current.style.maxHeight = `${scrollPosition}px`;
			videosContainerRef.current.style.overflowY = "auto";
		} else if (videosContainerRef.current) {
			videosContainerRef.current.style.maxHeight = "none";
			videosContainerRef.current.style.overflowY = "visible";
		}
	}, [filteredVideos.length, config.scrollAfterRow]);

	return (
		<Grid container spacing={1} sx={{ boxShadow: 1, padding: 1 }}>
			{config.showTitle && (
				<Grid size={{ xs: 12 }}>
					<Typography
						variant="h5"
						align="left"
						sx={{ mb: 2, m: 0, fontStyle: "italic" }}
						component="h2"
					>
						YouTube{" "}
						{channels.map((channel, index) => {
							const channelName =
								channel.name.length > 20
									? channel.name.slice(0, 20) + "..."
									: channel.name;

							return (
								<Chip
									key={channel.id}
									label={channelName}
									size="small"
									color={currentChipColor(index) as ChipColor}
									variant={
										selectedChannel === channel.name
											? "filled"
											: "outlined"
									}
									onClick={() =>
										setSelectedChannel(
											selectedChannel ===
												channel.channelUrl
												? null
												: channel.channelUrl
										)
									}
									sx={{
										mr: 0.5,
										mb: 0.5,
										"&:hover": {
											cursor: "pointer",
										},
									}}
								/>
							);
						})}
					</Typography>
				</Grid>
			)}
			<Box
				ref={videosContainerRef}
				sx={{
					width: "100%",
					overflowX: "hidden",
				}}
			>
				<Grid container spacing={1}>
					{filteredVideos.map((video) => (
						<Grid
							key={video.url}
							size={{ xs: 12, sm: 6, md: 4, lg: 3 }}
						>
							<YoutubeVideoCard {...video} />
						</Grid>
					))}
				</Grid>
			</Box>
		</Grid>
	);
};
