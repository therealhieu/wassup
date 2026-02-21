import "./globals.css";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Geist, Geist_Mono, Roboto } from "next/font/google";

import type { Metadata } from "next";
import { DashboardAppBar } from "@/components/app-bar/DashboardAppBar";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { AppTheme } from "../components/AppTheme";
import { AppConfigProvider } from "@/providers/AppConfigProvider";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const roboto = Roboto({
	weight: ["300", "400", "500", "700"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-roboto",
});

export const metadata: Metadata = {
	title: "Wassup",
	description: "Your personal dashboard",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} antialiased`}
			>
				<AppRouterCacheProvider>
					<ReactQueryProvider>
						<AppConfigProvider>
							<AppTheme>
								<DashboardAppBar />
								{children}
							</AppTheme>
						</AppConfigProvider>
					</ReactQueryProvider>
				</AppRouterCacheProvider>
			</body>
		</html>
	);
}

