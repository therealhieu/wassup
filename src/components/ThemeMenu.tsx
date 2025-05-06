import { THEME_OPTIONS, useDashboardContext } from "@/context/DashboardContext";
import { MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';

export const ThemeMenu = () => {
    const { theme, setTheme } = useDashboardContext();

    return (
        <Select
            value={theme}
            onChange={(e: SelectChangeEvent<string>) => setTheme(e.target.value as typeof theme)}
            size="small"
            sx={{
                minWidth: 120,
                border: '1px solid white',
                color: 'text.primary',
                '& .MuiSelect-select': {
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                },
                '& .MuiSvgIcon-root': {
                    color: 'text.primary'
                }
            }}
        >
            {THEME_OPTIONS.map((option) => (
                <MenuItem
                    key={option}
                    value={option}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                    }}
                >
                    {option === 'light' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                </MenuItem>
            ))}
        </Select>
    );
}