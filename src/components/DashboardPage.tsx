import { PageConfig } from "@/infrastructure/config.schemas";
import { DashboardColumn } from "./DashboardColumn";
import { Grid } from "@mui/material";

export interface DashboardPageProps {
	pageConfig?: PageConfig;
}

export function DashboardPage({ pageConfig }: DashboardPageProps) {
	return (
		<div style={{ padding: "0 8px" }}>
			<Grid container spacing={2}>
				{pageConfig?.columns.map((columnConfig, index) => (
					<Grid
						key={index}
						size={columnConfig.size}
						sx={{ p: 0, m: 0 }}
					>
						<DashboardColumn columnConfig={columnConfig} />
					</Grid>
				))}
			</Grid>
		</div>
	);
}
