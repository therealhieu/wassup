'use client';

import { useEffect, useState } from 'react';
import { AppConfig, AppConfigSchema } from '@/infrastructure/config/schemas';

export function useConfigSSE(url: string, initialConfig: AppConfig | null): [AppConfig | null, Error | null] {
    const [config, setConfig] = useState<AppConfig | null>(initialConfig);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        const es = new EventSource(url);

        es.onmessage = (event: MessageEvent) => {
            try {
                const raw = JSON.parse(event.data);
                const result = AppConfigSchema.safeParse(raw);
                if (result.success) {
                    setConfig(result.data);
                } else {
                    console.error('Invalid config shape', result.error);
                }
            } catch (err: any) {
                console.error('Malformed JSON from SSE', err);
                setError(err instanceof Error ? err : new Error(String(err)));
            }
        }

        es.onerror = (err: any) => {
            console.error('SSE error:', err);
            setError(err instanceof Error ? err : new Error(String(err)));
        }

        return () => {
            es.close();
        };
    }, [url]);

    return [config, error];
}
