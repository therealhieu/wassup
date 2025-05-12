import { useAppStore } from "@/providers/AppStoreContextProvider";
import { Button, Typography } from "@mui/material";
import { useRouter } from "next/navigation";

export const RouterMenu = () => {
	const router = useRouter();
	const appConfig = useAppStore((state) => state.appConfig);

	return (
		<div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
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
	);
};
