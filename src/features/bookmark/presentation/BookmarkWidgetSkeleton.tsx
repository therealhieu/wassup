"use client";

import React from "react";
import {
	Box,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Skeleton,
} from "@mui/material";

export const BookmarkWidgetSkeleton: React.FC = () => {
	return (
		<Box>
			{/* Group title placeholder */}
			<Skeleton variant="text" width="40%" height={32} sx={{ mb: 1 }} />

			<List disablePadding>
				{/* Placeholder for 5 bookmark items */}
				{[...Array(5)].map((_, idx) => (
					<ListItem key={idx} disableGutters sx={{ py: 0.5 }}>
						<ListItemButton>
							{/* Icon placeholder */}
							<ListItemIcon sx={{ minWidth: 32 }}>
								<Skeleton
									variant="circular"
									width={20}
									height={20}
								/>
							</ListItemIcon>
							{/* Text placeholder */}
							<ListItemText
								primary={
									<Skeleton
										variant="text"
										width="60%"
										height={20}
									/>
								}
							/>
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</Box>
	);
};
