"use client"
import Input from "@/components/Input/Input.jsx";
import { Select, SelectNoLabel } from "@/components/Select/Select.jsx";
import { CalculosFinales } from "./Calculos/Calculo.js";
import textAlign from "tailwindcss-logical/plugins/textAlign.js";
import { TextField, Box, Typography, Grid } from '@mui/material';


export default function Resumen({ children, conceptos, subTotal, Descuento, handleEditConcepto, handleDeleteConcepto }) {
    let finales = CalculosFinales(conceptos);
    console.log("Conceptos Rsumen", conceptos);

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}
        sx={{ flexGrow:1, padding: '1rem', margin:'auto', marginTop:'1rem'}}>
            <h3 className="card-title mb-6">Resumen</h3>
            
            <Grid container spacing={2} sx={{ gap: '1rem',  margin:'auto', marginTop:'1rem'}}
                xs={{ flexDirection: 'column' }}>
                <Grid size={ {width:'80%'}}>
                    
                        <table className="table table-striped  table-hover"
                            style={{width: '100%' }}>
                            <thead className="bg-primary-dark-total text-white h-12">
                                <tr sx={{textAlign:'center'}}>
                                    <th>#</th><th>Clave Prod.</th><th>Clave Unidad.</th><th>Concepto</th><th>Cantidad</th><th>Precio Unitario</th><th>Descuento</th><th>Traslados</th><th>Retenciones</th><th>Monto</th><th sx={{textAlign: 'center'}}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {conceptos.map((concepto, index) => (
                                    <tr key={index}>
                                        <th>{index + 1}</th>
                                        <td>{concepto.ClaveProdServ}</td>
                                        <td>{concepto.ClaveUnidad}</td>
                                        <td>{concepto.Descripcion}</td>
                                        <td>{concepto.Cantidad}</td>
                                        <td>{concepto.ValorUnitario}</td>
                                        <td>{concepto.Descuento}</td>
                                        <td>{concepto.TotalTraslados}</td>
                                        <td>{concepto.TotalRetenciones}</td>
                                        <td>{concepto.Subtotal + concepto.TotalTraslados - concepto.TotalRetenciones}</td>
                                        <td sx={{textAlign:'center'}}>
                                            <button
                                                type="button"
                                                onClick={() => handleEditConcepto(index)}
                                                className="px-3 py-1 text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 rounded-md shadow-sm transition duration-200 ease-in-out"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteConcepto(index)}
                                                className="px-3 py-1 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-md shadow-sm transition duration-200 ease-in-out ml-2"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    
                </Grid>
                <Grid size={ {xs: 6, md: 4, lg: 4, xl: 4 }}
                sx={{ padding: '1rem',
                  background: '#1b384a', color:'white', width:'25%'}}>
                        <table style={{width: '100%' }}>
                            <tbody>
                                <tr>
                                    <td style={{width: '110px'}}>Subtotal:</td>
                                    <td style={{width: '120px'}}>$ {finales.SubTotalFinal}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '110px'}}>Descuento:</td>
                                    <td style={{width: '120px'}}>$ {finales.DescuentoFinal}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '110px'}}>Retenciones:</td>
                                    <td style={{width: '120px'}}>$ {finales.RetencionesFinal}</td>
                                </tr>
                                <tr>
                                    <td style={{with: '110px'}}>Traslados:</td>
                                    <td style={{with: '120px'}}>$ {finales.TrasladosFinal}</td>
                                </tr>
                                <tr>
                                    <td style={{width: '110px'}}>Total:</td>
                                    <td style={{width: '120px'}}>$ {finales.TotalFinal}</td>
                                </tr>
                            </tbody>
                        </table>  
                </Grid>
            </Grid>
            {children}
     
       </Box>
    );
}
