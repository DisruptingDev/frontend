import React from 'react';
import MUIDataTable from 'mui-datatables';
import { Button } from '@mui/material';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

const VistaPlanes = ({ planes, selectedRows, handleSelectRow, handleVerComprobante, origen }) => {
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
      name: 'Plan.Nombre',
      label: 'Opción',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'Plan.CantidadTimbres',
      label: 'Timbres',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
      }
    },
    {
      name: 'FechaActivacion',
      label: 'Fecha Activación',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const plan = planes[tableMeta.rowIndex];
          return (
            <div style={{ textAlign: 'center' }}>
              {plan.Estatus === 'Aprobada' ? format(new Date(value), 'dd/MM/yyyy', { locale: es }) : ''}
            </div>
          );
        }
      }
    },
    {
      name: 'Plan.Costo',
      label: 'Monto',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (value) => <div style={{ textAlign: 'center' }}>{value}</div>
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
          const plan = planes[tableMeta.rowIndex];
          return value ? (
            <div style={{ textAlign: 'center' }}>
              <Button
                variant="text"
                onClick={() => handleVerComprobante(plan.ID)}
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
      planes.findIndex(plan => plan.ID === id)
    ),
    onRowSelectionChange: (currentRowsSelected, allRowsSelected, rowsSelected) => {
      const selectedIds = rowsSelected.map(index => planes[index].ID);
      const changedRow = planes[rowsSelected[rowsSelected.length - 1]];
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
    customToolbarSelect: selectedRows => {
      // Puedes personalizar la barra de herramientas para filas seleccionadas aquí
      return null;
    },
    rowsPerPageOptions: [5, 10, 20],
    downloadOptions: {
      filename: 'planes.csv',
      separator: ',',
    },
    print: false,
    viewColumns: true,
    filter: true,
  };

  // Preparar datos para la tabla
  const data = planes.map(plan => ({
    ID: plan.ID,
    'Plan.Nombre': plan.Plan.Nombre,
    'Plan.CantidadTimbres': plan.Plan.CantidadTimbres,
    FechaActivacion: plan.FechaActivacion,
    'Plan.Costo': plan.Plan.Costo,
    Estatus: plan.Estatus,
    ComprobantePath: plan.ComprobantePath
  }));

  return (
    <MUIDataTable
      title={origen === 'Pagos' ? "Historial de Pagos" : "Planes Disponibles"}
      data={data}
      columns={columns}
      options={options}
    />
  );
};

export default VistaPlanes;