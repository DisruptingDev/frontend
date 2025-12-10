"use client";
import { Dialog, DialogContent, DialogTitle, IconButton, CircularProgress, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function PdfModal({ open, onClose, pdfUrl, loading, error }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ style: { height: '90vh' } }}
    >
      <DialogTitle>
        Vista previa del documento
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        {!loading && !error && pdfUrl && (
          <iframe
            src={pdfUrl}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
            title="Vista previa del documento"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}