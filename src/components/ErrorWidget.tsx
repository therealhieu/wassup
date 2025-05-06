import { Card, CardContent, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

interface ErrorWidgetProps {
    error?: Error;
}

export const ErrorWidget = ({ error }: ErrorWidgetProps) => {
    return (
        <Card sx={{ width: '100%', bgcolor: '#FFF4F4', minHeight: 200 }}>
            <CardContent sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                height: '100%',
                minHeight: 168 // 200px - default CardContent padding
            }}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Typography color="error" variant="h6" align="center">
                    An error occurred while loading this widget
                </Typography>
                {error && <Typography color="error" variant="body1" align="center">{error.message}</Typography>}
            </CardContent>
        </Card>
    );
};
