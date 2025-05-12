"use client";

import React from "react";
import { BookmarkWidgetConfig } from "../infrastructure/config.schemas";
import { BookmarkWidgetInner } from "./BookmarkWidgetInner";

export interface BookmarkWidgetProps {
	config: BookmarkWidgetConfig;
}

export const BookmarkWidget = ({ config }: BookmarkWidgetProps) => {
	return <BookmarkWidgetInner config={config} />;
};
