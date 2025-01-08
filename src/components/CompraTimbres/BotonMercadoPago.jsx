import React, { useEffect, useState } from 'react';
import { Wallet } from '@mercadopago/sdk-react';

const CheckoutButton = ({ preferenceId }) => {
    return (
        <div>
            {preferenceId ? (
                <Wallet
                    initialization={{ preferenceId, redirectMode: 'blank' }}
                    
                    customization={{
                        texts: {
                            valueProp: '¡Paga de forma rápida y segura!',
                        },
                    }}
                />
            ) : (
               null
            )}
        </div>
    );
};

export default CheckoutButton;
