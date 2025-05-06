import { Divider } from "@mui/material";

import { Card, Skeleton } from "@mui/material";

import { CardContent } from "@mui/material";

import { Box } from "@mui/material";

export const WeatherWidgetSkeleton = () => {
    return (
        <Card sx={{ width: '100%' }}>
            <Box>
                <CardContent>
                    <Skeleton variant="text" height={48} width="50%" />
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Skeleton variant="circular" width={64} height={64} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" height={32} width="80%" />
                            <Skeleton variant="text" height={24} width="60%" />
                        </Box>
                    </Box>
                </CardContent>
            </Box>
            <Divider />
            <Box>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                        {[1, 2, 3, 4].map((i) => (
                            <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Skeleton variant="text" width={40} />
                                <Skeleton variant="circular" width={48} height={48} />
                                <Skeleton variant="text" width={60} />
                            </Box>
                        ))}
                    </Box>
                </CardContent>
            </Box>
        </Card>
    );
};