"use client"
import React from 'react';
import { Typography } from '@mui/material';

export default function FileInput({ name, onChange, error, ...props }) {
    return (
        <div >
            <label className={`form-control w-full h-full ${error ? 'border-red-500' : ''}`}>
                <div className="label">
                    <span className={`label-text ${error ? 'text-red-500' : 'text-black'}`}>{name}</span>
                </div>
                <input
                    type="file"
                    className={`file-input file-input-bordered h-14  w-full ${error ? 'border-red-500' : ''}`}
                    onChange={onChange} // Llama al onChange que se pasa desde el componente padre
                    {...props}
                />
            </label>
            {error && (
                <Typography color="error" variant="body2">
                    Este campo es obligatorio.
                </Typography>
            )}
        </div>
    );
}
