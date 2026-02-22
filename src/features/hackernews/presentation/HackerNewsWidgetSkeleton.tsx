import React from "react";
import { Box, Card, CardContent, Skeleton, Stack } from "@mui/material";

export const HackerNewsWidgetSkeleton: React.FC = () => {
    return (
        <Card>
            <CardContent>
                <Stack spacing={2}>
                    {Array(3)
                        .fill(0)
                        .map((_, index) => (
                            <Box
                                key={index}
                                sx={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: 1,
                                }}
                            >
                                <Box sx={{ width: "100%" }}>
                                    <Skeleton variant="text" width="90%" />
                                    <Skeleton variant="text" width="60%" />
                                </Box>
                            </Box>
                        ))}
                </Stack>
            </CardContent>
        </Card>
    );
};
