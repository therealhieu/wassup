import { ColumnConfig, WidgetConfig } from "@/infrastructure/config.schemas";
import { Widget } from "./Widget";
import { memo } from "react";

interface DashboardColumnProps {
	columnConfig: ColumnConfig;
}

export const DashboardColumn = memo(function DashboardColumn({ columnConfig }: DashboardColumnProps) {
	return (
		<div>
			{columnConfig.widgets.map(
				(widgetConfig: WidgetConfig, index: number) => (
					<Widget
						key={`${widgetConfig.type}-${index}`}
						widgetConfig={widgetConfig}
					/>
				)
			)}
		</div>
	);
});
