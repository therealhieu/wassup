import { Grid, Box } from "@mui/material";
import { YoutubeCardSkeleton } from "./YoutubeCardSkeleton";

export const YoutubeWidgetSkeleton = () => {
	return (
		<Box sx={{ width: "100%", padding: 2 }}>
			<Grid container spacing={2}>
				{[...Array(6)].map((_, index) => (
					<Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
						<YoutubeCardSkeleton />
					</Grid>
				))}
			</Grid>
		</Box>
	);
};
