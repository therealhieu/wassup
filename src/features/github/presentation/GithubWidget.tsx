import { useState, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { GithubWidgetConfig } from "../infrastructure/config.schemas";
import { fetchGithubWidgetProps } from "../services/github.actions";
import { GithubWidgetInner, generateDateMarks } from "./GithubWidgetInner";
import { GithubWidgetSkeleton } from "./GithubWidgetSkeleton";
import { ErrorWidget } from "@/components/ErrorWidget";

interface GithubWidgetProps {
    config: GithubWidgetConfig;
}

export const GithubWidget = ({ config }: GithubWidgetProps) => {
    const [dateRange, setDateRange] = useState(config.dateRange);
    const [starRange, setStarRange] = useState<[number?, number?]>([
        config.minStars,
        config.maxStars,
    ]);

    const { values: dateValues } = useMemo(
        () => generateDateMarks(config.createdAfter),
        [config.createdAfter]
    );
    const lastDateValue = dateValues[dateValues.length - 1];

    const [createdAfterRange, setCreatedAfterRange] = useState<
        [string, string]
    >([config.createdAfter, lastDateValue]);

    const effectiveConfig = {
        ...config,
        dateRange,
        minStars: starRange[0],
        maxStars: starRange[1],
        createdAfter: createdAfterRange[0],
        createdBefore:
            createdAfterRange[1] === lastDateValue
                ? undefined
                : createdAfterRange[1],
    };

    const {
        data: props,
        isLoading,
        isFetching,
        error,
    } = useQuery({
        queryKey: [
            "github",
            config.language,
            config.topics,
            createdAfterRange[0],
            createdAfterRange[1],
            dateRange,
            config.limit,
            starRange[0],
            starRange[1],
        ],
        queryFn: () => fetchGithubWidgetProps(effectiveConfig),
        staleTime: 1000 * 60 * 5,
        placeholderData: keepPreviousData,
    });

    if (isLoading || !props) {
        return <GithubWidgetSkeleton />;
    }

    if (error && !props) {
        return <ErrorWidget error={error} />;
    }

    return (
        <GithubWidgetInner
            {...props}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            starRange={starRange}
            onStarRangeChange={setStarRange}
            createdAfterStart={config.createdAfter}
            createdAfterRange={createdAfterRange}
            onCreatedAfterRangeChange={setCreatedAfterRange}
            isRefreshing={isFetching}
        />
    );
};
