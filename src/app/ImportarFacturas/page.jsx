"use client" // Indica que es un componente del lado del cliente
import { useState, useEffect } from "react"; // Importa los hooks useState y useEffect de React
import { useRouter } from "next/navigation"; // Importa el hook useRouter de next/navigation, encargado de redirigir a otras páginas
import Header from "@/components/Header/Header.jsx"; // Importa el componente Header
import { isAuthenticated } from "@/utils/authRedirect"; // Importa la función isAuthenticated, valdia que se haya iniciado sesión
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid } from "@mui/material"; // Importa los componentes Box, Button, Dialog, DialogTitle y DialogContent de Material-UI
import ModalCSV from "@/components/FacturasMasivas/ModalCSV"; // Importa el componente ModalCSV
import ModalFacturasError from "@/components/FacturasMasivas/Modal"; // Importa el componente Modal
import ModalError from "@/components/Home/Modales/modalError"; // Importa el componente ModalError
import ModalExito from "@/components/Home/Modales/modalExito"; // Importa el componente ModalExito
import VistaFacturasImportadas from "@/components/FacturasMasivas/VistaFacturasImportadas"; // Importa el componente VistaFacturasImportadas
import FormatearFactura from "@/components/FacturasMasivas/FormatearFactura"; // Importa la función FormatearFactura, da el formato que espera el microservicio
import SideBarMenu from "@/components/Dashborard/SideBarMenu";

const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Obtiene la URL del API desde las variables de entorno

export default function ImportarFacturas() {
    const router = useRouter(); // Inicializa el hook useRouter
    //Estados para los modales
    const [openModal, setOpenModal] = useState(false); // Inicializa el estado openModal en false
    const [openModalExito, setOpenModalExito] = useState(false); // Inicializa el estado openModalExito en false
    const [openModalError, setOpenModalError] = useState(false); // Inicializa el estado openModalError en false
    const [openModalFacturasError, setOpenModalFacturasError] = useState(false); // Inicializa el estado openModalFacturasError en false
    const [respuestaModal, setRespuestaModal] = useState(false); // Inicializa el estado respuestaModal en false
    const [confirmationMessage, setConfirmationMessage] = useState(""); // Inicializa el estado confirmationMessage en un string vacío

    //Estados de las facturas importadas
    const [facturas, setFacturas] = useState([]); // Inicializa el estado facturas en un arreglo vacío
    const [facturasSinErrores, setFacturasSinErrores] = useState([]); // Inicializa el estado facturasSinErrores en un arreglo vacío

    const [token, setToken] = useState(""); // Inicializa el estado token en un string vacío

    //Efecto que ejecuta al cargar la página, valida si el usuario está autenticado
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) { // Si no hay token, redirige a la página de inicio de sesión
            router.push("/IniciaSesion");
        } else {
            // Si hay token, guarda el token en el estado
            setToken(token);
        }
    }, [router]);

    //Funciones para abrir y cerrar los modales
    const handleOpenModal = () => {
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
    };
    const handleCloseModalError = () => {
        setOpenModalError(false);
    };

    //Función para descargar la plantilla de facturas
    const handleDescargarPlantilla = async () => {
        try {

            const response = await fetch(`${apiUrl}/api/cargamasivafacturas/DescargarCSV`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },

            });

            if (response.ok) {
                // Si la respuesta es válida, descarga el archivo
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = "Plantilla_Factura_Masiva.xlsx"; //Nombre del archivo
                link.click();
            }

        } catch (error) {
            console.error(error);

        }
    };

    //Función para guardar las facturas
    const handleGuardarFacturas = async () => {
        console.log(facturas);
        let facturasFormateadas = [];


        // Función para validar si un objeto contiene errores
        const hasError = (obj) => {
            return Object.keys(obj).some((key) => key.includes("Error") && obj[key] === "record not found");
        };

        // Validar cuántas facturas tienen errores
        const facturasConErrores = facturas.filter((factura) => {
            return (
                hasError(factura.Concepto) ||
                hasError(factura.Emisor) ||
                hasError(factura.Impuesto) ||
                hasError(factura.Receptor)
            );
        });
        // Validar cuántas facturas no tienen errores
        const facturasSinErrores = facturas.filter((factura) => {
            return !hasError(factura.Concepto) && !hasError(factura.Emisor) && !hasError(factura.Impuesto) && !hasError(factura.Receptor);
        });
        console.log(facturasConErrores);
        console.log(facturasSinErrores);
        //Si hay todas las facturas contienen errores, 

        if (facturasConErrores.length === facturas.length) {
            console.log("Todas las facturas contienen errores");
            // Mostrar modal con un mensaje de error
            setOpenModalError(true);
            setConfirmationMessage("Todas las facturas contienen errores");
        }
        else {
            // Si no hay facturas con errores
            if (facturasConErrores.length > 0) {
                console.log("Hay facturas con errores");

                setFacturasSinErrores(facturasSinErrores); // Guardar las facturas sin errores en el estado
                // Mostrar modal con las facturas con errores, para permitir si continuar o no
                setOpenModalFacturasError(true);
                setConfirmationMessage(`Hay facturas ${facturasConErrores.length} con errores`);
            }
            // Si no hay facturas con errores
            else if (facturasConErrores.length === 0) {
                console.log("Procesando facturas sin errores...");

                // Formatear las facturas sin errores
                facturasFormateadas = facturasSinErrores.map((factura) => FormatearFactura([factura]));

                console.log("Facturas formateadas:", facturasFormateadas);

                let exito = 0; // Inicializa la variable exito en 0
                // Recorre las facturas formateadas y las guarda en la API
                try {
                    for (const factura of facturasFormateadas) {
                        console.log("Factura a guardar", factura);
                        console.log("API URL", apiUrl);
                        const response = await fetch(`${apiUrl}/api/facturas/GuardarFactura`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(factura)
                        });
                        const result = await response.json();
                        console.log("Resultado", result);
                        if (response.ok) {
                            console.log("Factura guardada correctamente");
                            exito++; // Incrementa la variable exito
                        } else {
                            console.error("Error al guardar la factura");
                        }
                    }
                    console.log("Facturas guardadas", exito);
                    // Muestra un modal con un mensaje de éxito
                    setConfirmationMessage(`Se guardaron ${exito} facturas con éxito`);
                    setOpenModalExito(true);
                    setTimeout(() => {
                        router.push("/Home"); // Cambia "/pagina-destino" por la ruta deseada
                    }, 2000); // Espera 3 segundos antes de redirigir
                } catch (error) {
                    console.error(error);
                }

            }
        }
    };

    //Efecto para cuando se acepta guardar facturas aun cuando hay algunas con errores, las facturas con errores se ignoran
    useEffect(() => {
        //Funcion para guardar las facturas
        async function guardarFacturas() {
            //Si la respuesta del modal es continuar (true)
            if (respuestaModal) {
                console.log("Respuesta modal", respuestaModal);
                console.log("FActuras a guardar", facturasSinErrores);
                let exito = 0; // Inicializa la variable exito en 0
                // Formatear las facturas sin errores
                const facturasFormateadas = facturasSinErrores.map((factura) => FormatearFactura([factura]));
                try {
                    // Recorre las facturas formateadas y las guarda en la API
                    for (const factura of facturasFormateadas) {
                        console.log("Factura a guardar", factura);
                        console.log("API URL", apiUrl);
                        const response = await fetch(`${apiUrl}/api/facturas/GuardarFactura`, {
                            method: 'POST',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(factura)
                        });
                        const result = await response.json();
                        console.log("Resultado", result);
                        if (response.ok) {
                            console.log("Factura guardada correctamente");
                            exito++; // Incrementa la variable exito
                        } else {
                            console.error("Error al guardar la factura");
                        }
                    }
                    console.log("Facturas guardadas", exito);
                    // Muestra un modal con un mensaje de éxito
                    setConfirmationMessage(`Se guardaron ${exito} facturas con éxito`);
                    setOpenModalExito(true);
                    setTimeout(() => {
                        router.push("/Home"); // Cambia "/pagina-destino" por la ruta deseada
                    }, 2000); // Espera 3 segundos antes de redirigir
                } catch (error) {
                    console.error(error);
                }
                setRespuestaModal(false);
            }
        }
        guardarFacturas();
    }, [facturasSinErrores, respuestaModal, token]);

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item sx={{ flexGrow: 1 }}>
                    <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                        <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
                            <Button
                                variant="contained"
                                sx={{
                                    backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',

                                }}
                                onClick={handleOpenModal}

                            >
                                Importar Facturas
                            </Button>
                            <Button
                                variant="contained"
                                sx={{
                                    backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',

                                }}
                                onClick={handleDescargarPlantilla}
                            >
                                Descargar Plantilla
                            </Button>
                        </Box>
                        <VistaFacturasImportadas facturasRecuperadas={facturas} token={token} />
                        <ModalCSV token={token} open={openModal} handleClose={handleCloseModal} handleUpload={setFacturas} />
                        <ModalError openModalError={openModalError} handleCloseModal={handleCloseModalError} confirmationMessage={confirmationMessage} />
                        {facturas.length > 0 &&
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    }}
                                    onClick={handleGuardarFacturas}
                                >
                                    Importar
                                </Button>
                            </Box>
                        }
                    </Box>
                </Grid>
            </Grid>
        </div>
    )
}