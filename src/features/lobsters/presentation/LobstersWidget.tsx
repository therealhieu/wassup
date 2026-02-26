import { useQuery } from "@tanstack/react-query";
import { LobstersWidgetConfig } from "../infrastructure/config.schemas";
import { fetchLobstersWidgetProps } from "../services/lobsters.actions";
import { LobstersWidgetInner } from "./LobstersWidgetInner";
import { LobstersWidgetSkeleton } from "./LobstersWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

export interface LobstersWidgetProps {
    config: LobstersWidgetConfig;
}

export const LobstersWidget = ({ config }: LobstersWidgetProps) => {
    const {
        data: props,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["lobsters", config.sort, config.tag, config.limit],
        queryFn: () => fetchLobstersWidgetProps(config),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    if (isLoading || !props) {
        return <LobstersWidgetSkeleton />;
    }

    if (error) {
        return <ErrorWidget error={error} />;
    }

    return <LobstersWidgetInner {...props} />;
};
