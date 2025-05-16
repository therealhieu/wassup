import {
	InputBase,
	MenuItem,
	Select,
	SelectChangeEvent,
	styled,
} from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useAppStore } from "@/providers/AppStoreContextProvider";
import { THEME_OPTIONS } from "@/lib/constants";

const StyledInput = styled(InputBase)(() => ({
	"& .MuiInputBase-input": {},
}));

export const ThemeMenu = () => {
	const theme = useAppStore((state) => state.appConfig.ui.theme);
	const setTheme = useAppStore((state) => state.setTheme);

	return (
		<Select
			value={theme}
			onChange={(e: SelectChangeEvent<string>) => {
				setTheme(e.target.value as "light" | "dark");
			}}
			size="small"
			sx={{
				color: "text.primary",
				"& .MuiSelect-select": {
					display: "flex",
					alignItems: "center",
					gap: 1,
				},
				"& .MuiSvgIcon-root": {
					color: "text.primary",
				},
				"&:hover": {
					borderColor: "text.primary", // Added hover effect to match SignInButton
				},
			}}
			input={<StyledInput />}
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
				</MenuItem>
			))}
		</Select>
	);
};
