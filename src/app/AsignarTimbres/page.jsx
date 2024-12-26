"use client";

import Header from '@/components/Header/Header';
import { Box, Tabs, Tab, Typography, Button } from '@mui/material';
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import VistaOrdenes from '@/components/VistaOrdenes/VistaOrdenes';
import VistaPaquetes from '@/components/VistaOrdenes/VistaPaquetes';
import VistaPlanes from '@/components/VistaOrdenes/VistaPlanes';
import ModalComprobante from '@/components/VistaOrdenes/ModalComprobante';
import SideBar from '@/components/Dashborard/SideBar';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/authRedirect";
import { set } from 'date-fns';

function createData(item) {
    return { ...item };
}
export default function AsignarTimbres() {
    const [valorTab, setValorTab] = useState(0);
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");

    const [selectedRows, setSelectedRows] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    const [actualizar, setActualizar] = useState(false);

    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(true);

    const [paquetes, setPaquetes] = useState([]);
    const [planes, setPlanes] = useState([]);

    const [openModalExito, setOpenModalExito] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else {
            console.log('Token', token);
            setToken(token);
        }
    }, [router]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value);
    }

    const fetchPaquetes = useCallback(async () => {
        if (token) {
            console.log('Fetching Paquetes', token);
            try {
                const response = await fetch(`${apiUrl}/api/activacionordenes/ListarOrdenesPaquetes`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                console.log('Data', data);

                if (Array.isArray(data)) {
                    const transformedData = data.map((item) => createData(item));
                    const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
                    setPaquetes(sortedData);

                } else {
                    console.error('Expected an array but received:', typeof data);
                }
            } catch (error) {
                console.error('Error fetching ordenes:', error);
            } finally {
                setLoading(false);
            }

        }
    }, [token]);

    const fetchPlanes = useCallback(async () => {
        if (token) {
            console.log('Fetching Paquetes', token);
            try {
                const response = await fetch(`${apiUrl}/api/activacionordenes/ListarOrdenesPlanes`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                console.log('Data', data);

                if (Array.isArray(data)) {
                    const transformedData = data.map((item) => createData(item));
                    const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
                    setPlanes(sortedData);
                } else {
                    console.error('Expected an array but received:', typeof data);
                }
            } catch (error) {
                console.error('Error fetching ordenes:', error);
            } finally {
                setLoading(false);
            }

        }
    }, [token]);

    useEffect(() => {
        fetchPaquetes();
        fetchPlanes();
    }, [fetchPaquetes, fetchPlanes, token]);

    useEffect(() => {
        if (actualizar) {

            fetchPaquetes();
            fetchPlanes();
            setActualizar(false);
            setSelectedRows([]);
        }
    }, [actualizar, fetchPaquetes, fetchPlanes]);




    const handleMenuClick = (event, row) => {
        setAnchorEl(event.currentTarget);
        setMenuRow(row);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    const handleSelectRow = (row) => {
        setSelectedRows((prev) => {
            if (prev.includes(row.ID)) {
                return prev.filter((id) => id !== row.ID);
            } else {
                return [...prev, row.ID];
            }
        });
    };

    const selectedOrdenes = ordenes.filter((orden) => selectedRows.includes(orden.ID));
    const totalAPagar = selectedOrdenes.reduce((acc, orden) => acc + (orden.PlanID ? orden.Plan.Costo : orden.Paquete.Costo), 0);

    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setShowDetails(false); // Resetear al cerrar el modal
    };

    const handleToggleDetails = () => {
        setShowDetails((prev) => !prev);
    };

    const handleAsignarTimbres = async () => {
        // setLoading(true);
        const formData = selectedRows;
    
        console.log('Asignando timbres', formData);
        try {
          const response = await fetch(`${apiUrl}/api/activacionordenes/ActivarOrden`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
          });
          const data = await response.json();
          console.log(data);
          if (data) {
            setOpenModalExito(true);
            setActualizar(true);
          } else {
            throw new Error('Error al asignar timbres');
          }
        }
        catch (error) {
          console.error('Error asignando timbres:', error);
          setLoading(false);
          setOpenModalError(true);
        }
      }

    const handleVerComprobante = async (ID) => {
        console.log('Ver comprobante', ID);
        try {
            const response = await fetch(`${apiUrl}/api/activacionordenes/ComprobanteFile/${ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                window.open(url);
            }
            else {
                console.error('Error al obtener el comprobante');
            }
        } catch (error) {
            console.error('Error al obtener el comprobante', error
            );
        }
    }


    const manejarCambioTab = (event, newValue) => {
        setSelectedRows([]);
        setValorTab(newValue);
    };




    return (

        <Box sx={{ backgroundColor: '#f3f4f6', height: '98vh' }}>
            <Header />
            <SideBar />
            <Box
                sx={{
                    width: 'calc(100% - 250px)',  // Ajuste del ancho restando el tamaño de la barra lateral
                    height: 'calc(99vh - 6em)', // Ajuste de la altura restando el tamaño del header
                    marginLeft: 'auto',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    overflowY: 'auto'

                }}
            >
                {/* <Pagos token={token} /> */}

                <Tabs
                    value={valorTab}
                    onChange={manejarCambioTab}

                    textColor="#1b384a"
                    centered
                    sx={{
                        marginBottom: '0.5rem',

                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1b384a', // Cambiar el color del indicador aquí
                        },
                    }}
                >
                    <Tab label="Paquetes" />
                    <Tab label="Planes" />
                </Tabs>

                <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
                    <Button
                        variant="contained"
                        disabled={selectedRows.length === 0}
                        sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                        onClick={handleAsignarTimbres}
                    >
                        Asignar Timbres
                    </Button>
                </Box>

                {/* Mostrar el componente correspondiente */}
                {valorTab === 0 ? <VistaPaquetes paquetes={paquetes} selectedRows={selectedRows} handleSelectRow={handleSelectRow} handleVerComprobante={handleVerComprobante} origen={'Pagos'} /> :
                    <VistaPlanes planes={planes} selectedRows={selectedRows} handleSelectRow={handleSelectRow} handleVerComprobante={handleVerComprobante} origen={'Pagos'} />}

            </Box>
            <ModalExito openModalSuccess={openModalExito} handleCloseModal={() => setOpenModalExito(false)} confirmationMessage="Timbres asignados correctamente" />
      <ModalError openModalError={openModalError} handleCloseModal={() => setOpenModalError(false)} confirmationMessage="Error al asignar timbres" />
        </Box>

    );
}