import React from 'react';
import { WhatsApp } from '@mui/icons-material';

const WhatsAppButton = () => {
    const phoneNumber = '522227254392';
    const message = 'Hola, me gustaría obtener más información.';

    return (
        <a
            href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 bg-green-500 hover:bg-green-600 text-white p-3 sm:p-4 rounded-full shadow-2xl transition-transform hover:scale-110 z-50 flex items-center justify-center min-w-[48px] min-h-[48px]"
            aria-label="Contactar por WhatsApp"
        >
            <WhatsApp sx={{ fontSize: { xs: 28, sm: 36 } }} />
        </a>
    );
};

export default WhatsAppButton;
