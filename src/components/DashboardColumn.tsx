import { ColumnConfig, WidgetConfig } from "@/infrastructure/config.schemas";
import { Widget } from "./Widget";

interface DashboardColumnProps {
    columnConfig: ColumnConfig;
}

export function DashboardColumn({ columnConfig }: DashboardColumnProps) {
    return <div>
        {columnConfig.widgets.map((widgetConfig: WidgetConfig) => (
            <Widget key={widgetConfig.type} widgetConfig={widgetConfig} />
        ))}
    </div>;
};
