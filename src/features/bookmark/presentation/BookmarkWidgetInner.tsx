"use client";

import React, { useState, useEffect } from "react";
import {
	BookmarkWidgetConfig,
	Bookmark,
	BookmarkGroup,
} from "@/features/bookmark/infrastructure/config.schemas";
import {
	List,
	ListItemButton,
	ListItemText,
	ListSubheader,
	Collapse,
	Link,
	Typography,
	Card,
} from "@mui/material";
import BookmarkIcon from "@mui/icons-material/Bookmark";
import { getTitle } from "@/features/lib/utils";

interface BookmarkItemProps {
	bm: Bookmark;
	level: number;
}

// Renders a single bookmark; fetches page title if only URL is provided
const BookmarkItem = ({ bm, level }: BookmarkItemProps) => {
	const url = typeof bm === "string" ? bm : bm.url;
	const [title, setTitle] = useState<string>(
		typeof bm === "string" ? "" : bm.title
	);

	useEffect(() => {
		if (typeof bm === "string") {
			getTitle(url)
				.then((title) => setTitle(title))
				.catch(() => setTitle(url));
		}
	}, [bm, url]);

	return (
		<ListItemButton
			component={Link}
			href={url}
			target="_blank"
			rel="noopener noreferrer"
			sx={{ pl: level * 4, py: 0.5 }}
		>
			<BookmarkIcon fontSize="small" sx={{ mr: 1 }} />
			<ListItemText primary={title || url} />
		</ListItemButton>
	);
};

interface BookmarkGroupItemProps {
	group: BookmarkGroup;
	level?: number;
}

const BookmarkGroupItem = ({ group, level = 0 }: BookmarkGroupItemProps) => {
	const [open, setOpen] = useState(true);
	const toggle = () => setOpen((prev) => !prev);

	return (
		<List
			disablePadding
			subheader={
				<ListSubheader
					component="div"
					sx={{
						display: "flex",
						alignItems: "center",
						cursor: "pointer",
						pl: level * 2,
						bgcolor: "background.paper",
					}}
					onClick={toggle}
				>
					<Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
						{group.title}
					</Typography>
				</ListSubheader>
			}
		>
			<Collapse in={open} timeout="auto" unmountOnExit>
				<List disablePadding dense>
					{group.bookmarks.map((bm) => (
						<BookmarkItem
							key={typeof bm === "string" ? bm : bm.url}
							bm={bm}
							level={level}
						/>
					))}
					{group.groups?.map((sub) => (
						<BookmarkGroupItem
							key={sub.title}
							group={sub}
							level={level + 1}
						/>
					))}
				</List>
			</Collapse>
		</List>
	);
};

interface BookmarkWidgetInnerProps {
	config: BookmarkWidgetConfig;
}

export const BookmarkWidgetInner = ({ config }: BookmarkWidgetInnerProps) => (
	<Card>
		<BookmarkGroupItem group={config as BookmarkGroup} />
	</Card>
);
