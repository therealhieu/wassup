import React from "react";
import { Skeleton, Box, Stack } from "@mui/material";

export const YoutubeCardSkeleton = () => {
	return (
		<Box sx={{ p: 2 }}>
			{/* Thumbnail skeleton */}
			<Skeleton
				variant="rectangular"
				width="100%"
				height={192}
				sx={{ borderRadius: 1, mb: 2 }}
			/>

			<Skeleton variant="text" width="75%" sx={{ mb: 1 }} />

			<Stack
				direction="row"
				spacing={1}
				alignItems="center"
				sx={{ mb: 1 }}
			>
				<Skeleton variant="circular" width={32} height={32} />
				<Skeleton variant="text" width="33%" />
			</Stack>

			{/* Video stats skeleton */}
			<Stack direction="row" spacing={2}>
				<Skeleton variant="text" width={80} />
				<Skeleton variant="text" width={80} />
			</Stack>
		</Box>
	);
};
