import { useQuery } from "@tanstack/react-query";
import { DevtoWidgetConfig } from "../infrastructure/config.schemas";
import { fetchDevtoWidgetProps } from "../services/devto.actions";
import { DevtoWidgetInner } from "./DevtoWidgetInner";
import { DevtoWidgetSkeleton } from "./DevtoWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

export interface DevtoWidgetProps {
    config: DevtoWidgetConfig;
}

export const DevtoWidget = ({ config }: DevtoWidgetProps) => {
    const {
        data: props,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["devto", config.tags, config.top, config.limit],
        queryFn: () => fetchDevtoWidgetProps(config),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading || !props) {
        return <DevtoWidgetSkeleton />;
    }

    if (error) {
        return <ErrorWidget error={error} />;
    }

    return <DevtoWidgetInner {...props} />;
};
