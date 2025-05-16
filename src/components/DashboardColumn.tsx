import { ColumnConfig, WidgetConfig } from "@/infrastructure/config.schemas";
import { Widget } from "./Widget";

interface DashboardColumnProps {
	columnConfig: ColumnConfig;
}

export function DashboardColumn({ columnConfig }: DashboardColumnProps) {
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
}
