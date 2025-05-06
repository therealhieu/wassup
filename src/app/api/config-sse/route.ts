import chokidar from 'chokidar';
import fs from 'fs';
import { NextResponse } from 'next/server';
import path from 'path';
import yaml from 'yaml';

export const runtime = 'nodejs';

// module‐level broadcaster
const controllers = new Set<ReadableStreamDefaultController<string>>();
const filePath = path.resolve(process.cwd(), 'configs', 'wassup.yml');
function formatPayload() {
    const txt = fs.readFileSync(filePath, 'utf8');
    const obj = yaml.parse(txt);
    // prefix with `data:` for SSE
    return `data: ${JSON.stringify(obj)}\n\n`;
}

// single watcher for the file
const watcher = chokidar.watch(filePath, { ignoreInitial: true });
watcher.on('change', () => {
    const chunk = formatPayload();
    for (const ctrl of controllers) {
        ctrl.enqueue(chunk);
    }
});

export async function GET() {
    // make a fresh stream for this client
    let ctrlRef: ReadableStreamDefaultController<string>;

    const stream = new ReadableStream<string>({
        start(controller) {
            // remember this controller in our broadcast set
            ctrlRef = controller;
            controllers.add(controller);

            // send the initial payload
            controller.enqueue(formatPayload());
        },

        cancel() {
            // client disconnected, drop its controller
            controllers.delete(ctrlRef);
        }
    });

    return new NextResponse(stream, {
        status: 200,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
        }
    });
}
