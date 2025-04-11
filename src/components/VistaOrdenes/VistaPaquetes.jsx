import React from 'react';
import MUIDataTable from 'mui-datatables';
import { Button } from '@mui/material';

const VistaPaquetes = ({ paquetes, selectedRows, handleSelectRow, handleVerComprobante, origen }) => {
  // Configuración de columnas
  const columns = [
    {
      name: 'ID',
      label: 'ID',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'Paquete.Nombre',
      label: 'Opción',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'Paquete.CantidadTimbres',
      label: 'Timbres',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'Emisor__Nombre',
      label: 'Empresa',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'Paquete.Costo',
      label: 'Monto',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => (
          <div style={{ textAlign: 'center' }}>
            {new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
            }).format(value)}
          </div>
        )
      }
    },
    {
      name: 'Estatus',
      label: 'Estatus',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'ComprobantePath',
      label: 'Comprobante',
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          const paquete = paquetes[tableMeta.rowIndex];
          return value ? (
            <div style={{ textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => handleVerComprobante(paquete.ID)}
              >
                Ver
              </Button>
            </div>
          ) : null;
        }
      }
    }
  ];

  // Opciones de la tabla
  const options = {
    filterType: 'checkbox',
    responsive: 'standard',
    selectableRows: origen === 'Pagos' ? 'none' : 'multiple',
    rowsSelected: selectedRows.map(id => 
      paquetes.findIndex(paquete => paquete.ID === id)
    ),
    onRowSelectionChange: (currentRowsSelected, allRowsSelected, rowsSelected) => {
      const changedRow = paquetes[rowsSelected[rowsSelected.length - 1]];
      handleSelectRow(changedRow);
    },
    textLabels: {
      body: {
        noMatch: "No se encontraron registros",
        toolTip: "Ordenar",
        columnHeaderTooltip: column => `Ordenar por ${column.label}`
      },
      pagination: {
        next: "Siguiente",
        previous: "Anterior",
        rowsPerPage: "Filas por página:",
        displayRows: "de",
      },
      toolbar: {
        search: "Buscar",
        downloadCsv: "Descargar CSV",
        print: "Imprimir",
        viewColumns: "Ver columnas",
        filterTable: "Filtrar tabla",
      },
      filter: {
        all: "Todos",
        title: "FILTROS",
        reset: "REINICIAR",
      },
      viewColumns: {
        title: "Mostrar columnas",
        titleAria: "Mostrar/Ocultar columnas",
      },
      selectedRows: {
        text: "fila(s) seleccionada(s)",
        delete: "Eliminar",
        deleteAria: "Eliminar filas seleccionadas",
      },
    },
    customToolbarSelect: selectedRows => null,
    rowsPerPageOptions: [5, 10, 20],
    downloadOptions: {
      filename: 'paquetes.csv',
      separator: ',',
    },
    print: false,
    viewColumns: true,
    filter: true,
    setTableProps: () => ({
      style: {
        borderCollapse: 'separate',
      },
    }),
    setHeaderProps: () => ({
      style: {
        backgroundColor: '#0a2240', // Azul marino
        color: 'white',
        fontWeight: 'bold',
        fontSize: '1rem',
      },
    }),
  };

  // Preparar datos para la tabla
  const data = paquetes.map(paquete => ({
    ID: paquete.ID,
    'Paquete.Nombre': paquete.Paquete.Nombre,
    'Paquete.CantidadTimbres': paquete.Paquete.CantidadTimbres,
    'Emisor__Nombre': paquete.Emisor__Nombre,
    'Paquete.Costo': paquete.Paquete.Costo,
    'Estatus': paquete.Estatus,
    'ComprobantePath': paquete.ComprobantePath
  }));

  return (
    <MUIDataTable
      title={origen === 'Pagos' ? "Historial de Pagos" : "Paquetes Disponibles"}
      data={data}
      columns={columns}
      options={options}
    />
  );
};

export default VistaPaquetes;