// @ts-nocheck
import z from 'zod';

export const UrlBookmarkSchema = z.string().url();
export type UrlBookmark = z.infer<typeof UrlBookmarkSchema>;

export const DetailedBookmarkSchema = z.object({
    title: z.string(),
    url: z.string().url()
});
export type DetailedBookmark = z.infer<typeof DetailedBookmarkSchema>;


export const BookmarkSchema = z.union([UrlBookmarkSchema, DetailedBookmarkSchema]);
export type Bookmark = z.infer<typeof BookmarkSchema>;

export type BookmarkGroup = {
    title: string;
    bookmarks: Bookmark[];
    groups?: BookmarkGroup[];
}

export const BookmarkGroupSchema: z.ZodType<BookmarkGroup> = z.object({
    title: z.string(),
    bookmarks: z.array(BookmarkSchema).default([]),
    groups: z.lazy(() => z.array(BookmarkGroupSchema)).default([]),
});

export const BookmarkWidgetConfigSchema = z.object({
    type: z.literal('bookmark'),
}).merge(BookmarkGroupSchema);

export type BookmarkWidgetConfig = {
    type: 'bookmark';
} & BookmarkGroup;