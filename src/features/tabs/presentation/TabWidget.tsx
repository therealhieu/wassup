import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import { Box } from "@mui/material";
import Tab from "@mui/material/Tab";
import { useState } from "react";
import { z } from "zod";

import { TabsWidgetConfigSchema } from "../infrastructure/config.schemas";
import { Widget } from "@/components/Widget";
import { WidgetConfig } from "@/infrastructure/config.schemas";

export const TabsWidgetPropsSchema = z.object({
	config: TabsWidgetConfigSchema,
});

export type TabsWidgetProps = z.infer<typeof TabsWidgetPropsSchema>;

export const TabsWidget = ({ config }: TabsWidgetProps) => {
	const [value, setValue] = useState("0");

	const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
		setValue(newValue);
	};

	return (
		<TabContext value={value}>
			<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
				<TabList onChange={handleChange} aria-label="widget tabs">
					{config.labels.map((label: string, index: number) => (
						<Tab
							key={index}
							label={label}
							value={index.toString()}
						/>
					))}
				</TabList>
			</Box>

			{config.tabs.map(
				(widgetConfig: WidgetConfig, widgetIndex: number) => (
					<TabPanel
						value={widgetIndex.toString()}
						key={widgetIndex}
						style={{ padding: 0 }}
					>
						<Widget key={widgetIndex} widgetConfig={widgetConfig} />
					</TabPanel>
				)
			)}
		</TabContext>
	);
};
