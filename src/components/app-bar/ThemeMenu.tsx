import {
	InputBase,
	MenuItem,
	Select,
	SelectChangeEvent,
	styled,
} from "@mui/material";
import { DarkMode, LightMode } from "@mui/icons-material";
import { useAppConfig } from "@/providers/AppConfigProvider";
import { THEME_OPTIONS } from "@/lib/constants";

const StyledInput = styled(InputBase)(() => ({
	"& .MuiInputBase-input": {},
}));

export const ThemeMenu = () => {
	const { config, setTheme } = useAppConfig();
	const theme = config.ui.theme;

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
					borderColor: "text.primary",
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
