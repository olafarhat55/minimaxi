import { Grid, Card, CardContent, Skeleton, Box } from '@mui/material';

interface GridColumns {
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

interface CardGridSkeletonProps {
  count?: number;
  columns?: GridColumns;
}

const CardGridSkeleton = ({ count = 4, columns = { xs: 12, sm: 6, md: 3 } }: CardGridSkeletonProps) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
        <Grid size={columns} key={index}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" height={20} />
                  <Skeleton variant="text" width="40%" height={36} sx={{ mt: 1 }} />
                  <Skeleton variant="text" width="80%" height={16} sx={{ mt: 1 }} />
                </Box>
                <Skeleton variant="rounded" width={48} height={48} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default CardGridSkeleton;
