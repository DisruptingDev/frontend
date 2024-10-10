import { Modal, Box, Typography, List, ListItem, Alert, IconButton, ListItemIcon, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function ModalTimbrar({ openModalTimbrar, handleCloseModal, facturasTimbradas, expandedIndexes, handleToggleExpand }) {
return(
    <Modal open={openModalTimbrar} onClose={handleCloseModal}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60%',
          // minWidth: '400px',
          // maxWidth: '80%',
          maxHeight: '80vh', // Limita la altura máxima del modal
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: '16px',
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" gutterBottom>
          Resultados de Timbrado de Facturas
        </Typography>
        <Typography variant="subtitle1" gutterBottom>
          Total: {facturasTimbradas.length} | Exitosas: {facturasTimbradas.filter(f => f.status === 'success').length} | Con Error: {facturasTimbradas.filter(f => f.status === 'error').length}
        </Typography>

        <Box
          sx={{
            width: '100%',
            maxHeight: '60vh',
             // Limita la altura para hacer scroll si es necesario
            overflowY: 'auto',
             overflowX: 'hidden',
          }}
        >
          <List>
            {facturasTimbradas.map((factura, index) => (
              <ListItem key={index}>
                {/* <ListItemText primary={`Factura ${factura.id}`} /> */}
                {factura.status === 'error' ? (
                  <Box sx={{ width: '100%' }}>
                    <Alert severity="error" sx={{ mb: 2, width:'100%', overflowWrap: 'break-word', wordBreak: 'break-word', whiteSpace: 'normal' }}>
                      <Typography variant="body2" sx={{fontWeight:'bold'}} noWrap={!expandedIndexes[index]}>
                       Error en la Factura con ID: {factura.id}
                      </Typography>
                      <Typography variant="body2" noWrap={!expandedIndexes[index]}>
                        {factura.error}
                      </Typography>
                      <IconButton size="small" onClick={() => handleToggleExpand(index)}>
                        {expandedIndexes[index] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </Alert>
               
                  </Box>
                ) : (
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                )}
              </ListItem>
            ))}
          </List>
        </Box>

        <Button
          onClick={handleCloseModal}
          variant="contained"
          sx={{ mt: 2 }}
        >
          OK
        </Button>
      </Box>
    </Modal>
);
}