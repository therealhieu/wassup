import { WidgetConfigSchema } from '@/infrastructure/config.schemas';
import { z } from 'zod';

export const TabsWidgetConfigSchema = z.object({
    type: z.literal('tabs'),
    labels: z.array(z.string()),
    widgets: z.array(z.lazy(() => WidgetConfigSchema)),
})
    .refine((data) => data.labels.length === data.widgets.length, {
        message: 'Labels and widgets must have the same length',
        path: ['labels', 'widgets'],
    });

export type TabsWidgetConfig = z.infer<typeof TabsWidgetConfigSchema>;

