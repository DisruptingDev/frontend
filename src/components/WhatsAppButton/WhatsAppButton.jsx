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
            className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 z-50 flex items-center justify-center"
            aria-label="Chat on WhatsApp"
        >
            <WhatsApp sx={{ fontSize: 40 }} />
        </a>
    );
};

export default WhatsAppButton;
