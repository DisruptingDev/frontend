import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import TabContext from '@mui/lab/TabContext';
import Button from "@mui/material/Button";
import TabPanel from '@mui/lab/TabPanel';


// Datos de los paquetes
const folioPackagesData = [
  { nombre: 'Paquete 25', folios: 25, precio: '$ 290.00' },
  { nombre: 'Paquete 50', folios: 50, precio: '$ 406.00' },
  { nombre: 'Paquete 100', folios: 100, precio: '$ 570.00' },
  { nombre: 'Paquete 500', folios: 500, precio: '$ 1990.00' },
  { nombre: 'Paquete 1,000', folios: 1000, precio: '$ 2,784.00' },
  { nombre: 'Paquete 2,000', folios: 2500, precio: '$ 4,372.00' },
];

const highVolumePackagesData = [
  { nombre: 'Paquete 5,000', folios: 5000, precio: '$ 5,800.00' },
  { nombre: 'Paquete 25,000', folios: 25000, precio: '$ 27,550.00' },
  { nombre: 'Paquete 50,000', folios: 50000, precio: '$ 49,300.00' },
  { nombre: 'Paquete 100,000', folios: 100000, precio: '$ 87,000.00' },
  { nombre: 'Paquete 200,000', folios: 200000, precio: '$ 162,400.00' },
  { nombre: 'Paquete 500,000', folios: 500000, precio: '$ 382,800.00' },
];

import { useRouter } from 'next/navigation';

const CustomTabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index) => {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
};

const FolioPackages = () => {
  const router = useRouter();
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box id="paquetes" sx={{ scrollMarginTop: '100px' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', width: '100%' }}>
          <Tabs value={value} onChange={handleChange} centered >
            <Tab sx={{ fontSize: '1.0rem', fontWeight: 'bold' }} label={<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: { xs: 0, md: 0.5 } }}><span>Paquetes</span><span>PyMEs</span></Box>} {...a11yProps(0)} />
            <Tab sx={{ fontSize: '1.0rem', fontWeight: 'bold' }} label={<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', gap: { xs: 0, md: 0.5 } }}><span>Paquetes de</span><span>alto volumen</span></Box>} {...a11yProps(1)} />
          </Tabs>
        </Box>
        <CustomTabPanel value={value} index={0}>
          <Box
            className="section sectionNormal w-full" // Aplicamos clase para fondo y estilos comunes
            sx={{
              // padding, color, display, flexDirection, alignItems son manejados por la clase .section
              flex: { md: 1 }, // Para que ocupe espacio igual en layout de fila (md)
            }}
          >
            <h2 className="sectionTitle">Paquetes PyMEs de folios.</h2>
            <p className="sectionDescription">
              Ideales para aquellos emprendedores y pequeñas empresas que tienen un volumen de facturación bajo
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Nombre</th>
                  <th className="th">Folios</th>
                  <th className="th">Precio</th>
                </tr>
              </thead>
              <tbody>
                {folioPackagesData.map((pkg) => (
                  <tr key={pkg.nombre} className="tr">
                    <td className="td">{pkg.nombre}</td>
                    <td className="td">{pkg.folios}</td>
                    <td className="td">{pkg.precio}</td>
                    <td className="td">
                      <Button
                        variant="contained"
                        sx={{
                          backgroundColor: "#10968A",
                          ml: 2,
                          "&:hover": {
                            backgroundColor: "#0398a6",
                          },
                        }}
                        onClick={() => router.push("/AltaUsuarios")}
                      >
                        Comprar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          <Box
            component="section" // Mantenemos la semántica de <section>
            className="section sectionHighVolume"
            sx={{
              flex: { md: 1 }, // Para que ocupe espacio igual en layout de fila (md)
            }}
          >
            <h2 className="sectionTitle">Paquetes de alto volumen</h2>
            <p className="sectionDescription">
              Cumple con la demanda de folios en un alto volumen, dando un servicio de calidad apto para las empresas más exigentes.
            </p>
            <table className="table">
              <thead>
                <tr>
                  <th className="th">Nombre</th>
                  <th className="th">Folios</th>
                  <th className="th">Precio</th>
                </tr>
              </thead>
              <tbody>
                {highVolumePackagesData.map((pkg) => (
                  <tr key={pkg.nombre} className="tr">
                    <td className="td">{pkg.nombre}</td>
                    <td className="td">{pkg.folios}</td>
                    <td className="td">{pkg.precio}</td>
                    <td className="td">
                      <Button
                        variant="outlined"
                        color="inherit"
                        sx={{
                          ml: 2,
                          borderColor: "#ffffff ",
                          color: "#ffffff",
                          "&:hover": {
                            backgroundColor: "rgba(4, 75, 69, 1)",
                            borderColor: "#ffffff",
                          },
                        }}
                        onClick={() => router.push("/AltaUsuarios")}
                      >
                        Comprar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CustomTabPanel>
      </TabContext>


      <style>{`
        .section {
          padding: 40px 20px;
          color: white;
          flex: 1; /* Cada sección toma el mismo espacio si están en fila */
          display: flex;
          flex-direction: column;
          align-items: center; /* Centra el contenido de la sección */
        }

        .sectionNormal {
          background-color: #0a2e3f; /* Azul oscuro de la imagen */
        }

        .sectionHighVolume {
          background-color: #16837B; /* Verde azulado de la imagen */
        }

        .sectionTitle {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
          text-align: center;
        }

        .sectionDescription {
          font-size: 16px;
          margin-bottom: 30px;
          max-width: 450px; /* Limita el ancho de la descripción */
          text-align: center;
          line-height: 1.6;
        }

        .table {
          width: 100%;
          max-width: 500px; /* Limita el ancho de la tabla */
          border-collapse: collapse; /* Elimina espacios entre bordes de celdas */
          margin-bottom: 20px;
        }

        .th,
        .td {
          text-align: left;
          padding: 12px 15px; /* Espaciado interno de las celdas */
          border-bottom: 1px solid rgba(255, 255, 255, 1); /* Línea divisoria sutil */
        }

        .th {
          font-weight: bold;
          font-size: 18px;
          color:#ffffff;
        }

        .td {
          font-size: 16px;
        }

        .tr:last-child .td {
          border-bottom: none;
        }

        .buttonContainer {
          display: flex;
          justify-content: center; /* Centra el botón */
          padding: 20px 0; 
          width: 100%; 
          background-color: #0a2e3f; /* Coincide con el fondo de la primera sección por defecto en móvil */
        }
        
        @media (max-width: 767px) { /* Móvil (hasta 767px) */
            .sectionHighVolume {
                padding-bottom: 80px; /* Más espacio para el botón que se superpone */
            }
            .buttonContainer {
                position: relative; 
                margin-top: -45px; /* Mueve el botón hacia arriba para superponerse */
                z-index: 10;
                background-color: transparent; /* Para que no oculte la sección de abajo */
            }
        }

        .buyButton {
          background-color: #c74b4f; /* Rojo del botón */
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 11; 
        }

        .buyButton:hover {
          background-color: #a93b40; 
        }

        @media (min-width: 768px) { /* Desktop (768px en adelante) */
          /* El Box principal ya maneja flex-direction: row */
          .buttonContainer {
            position: absolute; 
            left: 50%;
            transform: translateX(-50%);
            bottom: -25px; 
            background-color: transparent; 
            padding: 0; 
            margin-top: 0; 
            z-index: 10;
            width: auto; /* El botón define su propio ancho */
          }
          .section {
            padding-bottom: 60px; /* Más espacio en la parte inferior para el botón */
          }
          /* Si el botón debe tener un fondo específico en desktop cuando está sobre las secciones */
          /* .buttonContainer { background-color: #someColor; } */
        }
        
        @media (min-width: 1024px) {
            .sectionTitle {
                font-size: 32px;
            }
            .sectionDescription {
                font-size: 18px;
            }
        }
      `}
      </style>
    </Box>
  );
};

export default FolioPackages;
