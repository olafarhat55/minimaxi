import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box } from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasActions?: boolean;
}

const TableSkeleton = ({ rows = 5, columns = 5, hasActions = true }: TableSkeletonProps) => {
  return (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
            {Array.from({ length: columns }).map((_, index) => (
              <TableCell key={index}>
                <Skeleton variant="text" width={80 + Math.random() * 40} />
              </TableCell>
            ))}
            {hasActions && (
              <TableCell align="center">
                <Skeleton variant="text" width={60} sx={{ mx: 'auto' }} />
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton
                    variant="text"
                    width={colIndex === 0 ? 100 : 60 + Math.random() * 60}
                  />
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                    <Skeleton variant="circular" width={28} height={28} />
                    <Skeleton variant="circular" width={28} height={28} />
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TableSkeleton;
