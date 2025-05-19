"use client";

import { Box } from "@mui/material";
import { APP_CONFIG_JSONSCHEMA } from "@/lib/constants";
import JsonView from "@uiw/react-json-view";

interface GuidesPanelProps {
	open: boolean;
}
export function GuidesPanel({ open }: GuidesPanelProps) {
	if (!open) return null;

	return (
		<Box
			sx={{
				position: "relative",
				width: "100%",
				maxWidth: "md",
				p: 3,
				m: 2,
			}}
		>
			<Box sx={{ mt: 2, overflow: "auto", maxHeight: "600px" }}>
				<JsonView
					value={APP_CONFIG_JSONSCHEMA}
					enableClipboard={false}
					displayDataTypes={false}
				/>
			</Box>
		</Box>
	);
}
