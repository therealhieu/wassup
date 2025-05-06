import TabContext from '@mui/lab/TabContext';
import TabList from '@mui/lab/TabList';
import TabPanel from '@mui/lab/TabPanel';
import { Box } from '@mui/material';
import Tab from '@mui/material/Tab';
import { useState } from 'react';
import { z } from 'zod';

import { TabsWidgetConfigSchema } from '../infrastructure/config.schemas';
import { Widget } from '@/components/Widget';

export const TabsWidgetPropsSchema = z.object({
    config: TabsWidgetConfigSchema,
});

export type TabsWidgetProps = z.infer<typeof TabsWidgetPropsSchema>;

export const TabsWidget = ({ config }: TabsWidgetProps) => {
    const [value, setValue] = useState('0');

    const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
        setValue(newValue);
    };

    return (
        <TabContext value={value}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleChange} aria-label="widget tabs">
                    {config.labels.map((label, index) => (
                        <Tab
                            key={index}
                            label={label}
                            value={index.toString()}
                        />
                    ))}
                </TabList>
            </Box>

            {config.widgets.map((widgetConfig, widgetIndex) => (
                <TabPanel value={widgetIndex.toString()} key={widgetIndex} style={{ padding: 0 }}>
                    <Widget key={widgetIndex} widgetConfig={widgetConfig} />
                </TabPanel>
            ))}
        </TabContext>
    );
};
