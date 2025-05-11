import { z } from "zod";
import { YoutubeVideoSchema } from "../domain/entities/video";
import { YoutubeVideoCard } from "./YoutubeVideoCard";
import { Chip, Grid, Typography } from "@mui/material";
import { YoutubeWidgetConfigSchema } from "../infrastructure/config.schemas";
import { YoutubeChannelSchema } from "../domain/entities/channel";
import Link from "next/link";

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
	const currentChipColor = (index: number) => {
		return chipColors[index % chipColors.length];
	};

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
						{channels.map((channel, index) => (
							<Chip
								key={channel.id}
								label={
									<Link
										href={`${channel.channelUrl}`}
										target="_blank"
										style={{ textDecoration: "none" }}
									>
										{channel.name}
									</Link>
								}
								size="small"
								color={currentChipColor(index) as ChipColor}
								variant="outlined"
								sx={{
									mr: 0.5,
									mb: 0.5,
									"&:hover": {
										cursor: "pointer",
										bgcolor: (theme) =>
											theme.palette[
												currentChipColor(index)
											].main,
										color: "white",
									},
								}}
							/>
						))}
					</Typography>
				</Grid>
			)}
			{videos.map((video) => (
				<Grid key={video.url} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
					<YoutubeVideoCard {...video} />
				</Grid>
			))}
		</Grid>
	);
};
