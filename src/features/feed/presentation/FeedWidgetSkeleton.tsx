import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Stack,
	Typography,
} from "@mui/material";
import { Skeleton } from "@mui/material";

export const FeedWidgetSkeleton = () => {
	return (
		<Stack spacing={2}>
			<Typography variant="h5" gutterBottom>
				Feeds
			</Typography>

			<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
				{[1, 2].map((i) => (
					<Skeleton
						key={i}
						variant="rectangular"
						width={120}
						height={32}
						sx={{ borderRadius: 16 }}
					/>
				))}
			</Box>

			{[1, 2, 3].map((i) => (
				<Card key={i}>
					<Box sx={{ display: "flex" }}>
						<Box sx={{ width: 200, flexShrink: 0 }}>
							<Skeleton
								variant="rectangular"
								width={200}
								height={200}
							/>
						</Box>
						<Box sx={{ flex: 1 }}>
							<CardHeader
								title={
									<Skeleton
										variant="text"
										width="80%"
										height={32}
									/>
								}
								sx={{ pb: 0 }}
							/>
							<CardContent sx={{ pt: 1 }}>
								<Skeleton
									variant="text"
									width="40%"
									height={24}
									sx={{ mb: 1 }}
								/>
								<Skeleton
									variant="text"
									width="100%"
									height={60}
								/>
								<Stack direction="row" spacing={1} mt={1}>
									{[1, 2].map((chip) => (
										<Skeleton
											key={chip}
											variant="rectangular"
											width={60}
											height={24}
											sx={{ borderRadius: 16 }}
										/>
									))}
								</Stack>
							</CardContent>
						</Box>
					</Box>
				</Card>
			))}
		</Stack>
	);
};
