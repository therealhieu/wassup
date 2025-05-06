'use client';

import { useDashboardContext } from '@/context/DashboardContext';
import { AppBar, Button, Toolbar, Typography } from '@mui/material';
import { ThemeMenu } from './ThemeMenu';
import { z } from 'zod';
import { useRouter } from 'next/navigation';

export const PageInfoSchema = z.object({
    title: z.string(),
    path: z.string(),
});

export type PageInfo = z.infer<typeof PageInfoSchema>;

export const PageMenu = () => {
    const { appConfig } = useDashboardContext();
    const router = useRouter();

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Typography variant="h6">Wassup</Typography>
            {appConfig.ui.pages.map((page) => (
                <Button
                    key={page.path}
                    color="inherit"
                    onClick={() => router.push(page.path)}
                >
                    {page.title}
                </Button>
            ))}
        </div>
    )
}


export const DashboardAppBar = () => {
    return (
        <AppBar position="static" sx={{ mb: 2, borderRadius: '16px', bgcolor: 'background.default', color: 'text.primary' }}>
            <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <PageMenu />
                <ThemeMenu />
            </Toolbar>
        </AppBar>
    );
}