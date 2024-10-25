import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

function createData(folio, emisor, receptor, total) {
    return { folio, emisor, receptor, total };
}

const rows = [
    createData(505, 'ESCUELA KEMPER URGATE', 'INTERNACIONAL XIMBO', '$150.00'),
    createData(1, 'HERRERIA & ELECTRICOS', 'KARLA FUENTE NOLASCO', '$116.00'),
    createData(55, 'RODRIGO KITIA CASTRO', 'Publico General', '$116.00'),
];

export default function UltimasFacturas() {
    return (
        <TableContainer component={Paper} sx={{height:'100%'}}>
            <Typography sx={{ fontSize: '1.2em', fontWeight: '600', marginLeft: '0.5em', margin: '0.5em' }}>
                Últimas Facturas
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Folio</TableCell>
                        <TableCell>Emisor</TableCell>
                        <TableCell>Receptor</TableCell>
                        <TableCell>Total</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.folio}>
                            <TableCell>{row.folio}</TableCell>
                            <TableCell>{row.emisor}</TableCell>
                            <TableCell>{row.receptor}</TableCell>
                            <TableCell>{row.total}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
