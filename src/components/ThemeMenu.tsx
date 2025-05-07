import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import { THEME_OPTIONS } from "@/lib/constants";

export const ThemeMenu = () => {
	const theme = useAppStore((state) => state.appConfig.ui.theme);
	const setTheme = useAppStore((state) => state.setTheme);

	return (
		<Select
			value={theme}
			onChange={(e: SelectChangeEvent<string>) =>
				setTheme(e.target.value as typeof theme)
			}
			size="small"
			sx={{
				minWidth: 120,
				border: "1px solid white",
				color: "text.primary",
				"& .MuiSelect-select": {
					display: "flex",
					alignItems: "center",
					gap: 1,
				},
				"& .MuiSvgIcon-root": {
					color: "text.primary",
				},
			}}
		>
			{THEME_OPTIONS.map((option) => (
				<MenuItem
					key={option}
					value={option}
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
					}}
				>
					{option === "light" ? (
						<LightMode fontSize="small" />
					) : (
						<DarkMode fontSize="small" />
					)}
					{option.charAt(0).toUpperCase() + option.slice(1)}
				</MenuItem>
			))}
		</Select>
	);
};
