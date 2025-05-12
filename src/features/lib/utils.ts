const urlToTitle = new Map<string, string>();

export async function getTitle(url: string): Promise<string> {
    if (urlToTitle.has(url)) {
        return urlToTitle.get(url)!;
    }

    // First look for an explicit API_BASE (e.g. in Storybook)
    const host =
        process.env.NEXT_PUBLIC_APP_URL || // e.g. http://localhost:3000
        window.location.origin;

    const proxy = `${host}/api/fetch-title?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { cache: "no-store" });
    const json = (await res.json()) as { title?: string };
    const title = json.title || url;

    urlToTitle.set(url, title);
    return title;
}
