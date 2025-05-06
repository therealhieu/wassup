'use client';

import { DashboardPage } from '@/components/DashboardPage';
import { useDashboardContext } from '@/context/DashboardContext';
import { PageConfig } from '@/infrastructure/config/schemas';
import { Box, Typography } from '@mui/material';
import { usePathname } from 'next/navigation';

export default function CatchAllPage() {
    const pathname = usePathname() || '/';
    const { appConfig } = useDashboardContext();

    const pageConfig = appConfig.ui.pages.find((p: PageConfig) => p.path === pathname);

    if (!pageConfig) {
        return (
            <Box p={4}>
                <Typography variant="h4">404 — Page Not Found</Typography>
                <Typography>No configuration for path: "{pathname}"</Typography>
            </Box>
        );
    }

    return <DashboardPage pageConfig={pageConfig} />;
}
