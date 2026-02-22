import { useQuery } from "@tanstack/react-query";
import { HackerNewsWidgetConfig } from "../infrastructure/config.schemas";
import { fetchHackerNewsWidgetProps } from "../services/hackernews.actions";
import { HackerNewsWidgetInner } from "./HackerNewsWidgetInner";
import { HackerNewsWidgetSkeleton } from "./HackerNewsWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

export interface HackerNewsWidgetProps {
    config: HackerNewsWidgetConfig;
}

export const HackerNewsWidget = ({ config }: HackerNewsWidgetProps) => {
    const {
        data: props,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["hackernews", config.sort, config.limit, config.query],
        queryFn: () => fetchHackerNewsWidgetProps(config),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading || !props) {
        return <HackerNewsWidgetSkeleton />;
    }

    if (error) {
        return <ErrorWidget error={error} />;
    }

    return <HackerNewsWidgetInner {...props} />;
};
