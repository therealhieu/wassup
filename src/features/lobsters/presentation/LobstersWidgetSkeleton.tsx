import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

export const LobstersWidgetSkeleton = () => (
    <Card>
        <CardContent>
            <Stack spacing={2}>
                {Array(3)
                    .fill(0)
                    .map((_, i) => (
                        <Box key={i}>
                            <Skeleton variant="text" width="90%" />
                            <Skeleton variant="text" width="60%" />
                            <Skeleton
                                variant="text"
                                width="30%"
                                height={18}
                            />
                        </Box>
                    ))}
            </Stack>
        </CardContent>
    </Card>
);
