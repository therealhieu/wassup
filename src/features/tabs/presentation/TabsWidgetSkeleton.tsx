import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box, Skeleton } from '@mui/material';
import Tab from '@mui/material/Tab';

export const TabsWidgetSkeleton = () => {
    return (
        <TabContext value="0">
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList aria-label="loading widget tabs">
                    <Tab label={<Skeleton width={60} />} value="0" />
                    <Tab label={<Skeleton width={60} />} value="1" />
                    <Tab label={<Skeleton width={60} />} value="2" />
                </TabList>
            </Box>
            <TabPanel value="0" style={{ padding: 0 }}>
                <Skeleton variant="rectangular" height={200} />
            </TabPanel>
        </TabContext>
    );
};

