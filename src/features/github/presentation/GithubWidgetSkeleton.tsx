import {
    Stack,
    Skeleton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from "@mui/material";

export const GithubWidgetSkeleton = () => {
    return (
        <Stack spacing={1} sx={{ boxShadow: 1, padding: 1 }}>
            <Skeleton variant="text" width={180} height={32} />
            <Skeleton variant="rounded" width={240} height={32} />
            <Skeleton variant="rounded" width="60%" height={24} />

            <TableContainer>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            {[...Array(7)].map((_, i) => (
                                <TableCell key={i}>
                                    <Skeleton
                                        variant="text"
                                        width={60}
                                    />
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {[...Array(5)].map((_, row) => (
                            <TableRow key={row}>
                                {[...Array(7)].map((_, col) => (
                                    <TableCell key={col}>
                                        <Skeleton
                                            variant="text"
                                            width={
                                                col === 0 ? 150 : 50
                                            }
                                        />
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Stack>
    );
};
