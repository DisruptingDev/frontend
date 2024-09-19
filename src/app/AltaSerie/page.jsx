"use client";
//Generate page
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '@/components/Header/Header.jsx';
import AltaSerie from '@/components/AltaSerie/AltaSerie';
import { Box } from '@mui/material';
import { isAuthenticated } from '@/utils/authRedirect';

export default function RegistroSeries() {
    return (
        <div>
        <Header />
        
            <AltaSerie/>
       
    </div>
    );
}
