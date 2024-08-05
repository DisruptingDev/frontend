import Input from "@/components/Input/Input.jsx"
import {Select, SelectNoLabel} from "@/components/Select/Select.jsx"

export default function Resumen( {children, conceptos} ) {
    return (
        <div className = "bg-white mx-4 p-4 shadow-xl rounded-md m-100">
            <h3 className = "card-title mb-6">Resumen</h3>
            <div className = "grid grid-cols-1 gap-6">
                <table className="table table-md">
                    <thead className = "bg-primary-dark-total text-white h-12">
                      <tr>
                        <th></th>
                        <th>Clave Prod.</th>
                        <th>Clave Unidad.</th>
                        <th>Concepto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Descuento</th>
                        <th>Traslados</th>
                        <th>Retenciones</th>
                        <th>Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                    {conceptos.map((concepto, index) => (
                      <tr>
                        <th>{index}</th>
                        <td>{concepto.ClaveProdServ}</td>
                        <td>{concepto.ClaveUnidad.Clave}</td>
                        <td>{concepto.Descripcion}</td>
                        <td>{concepto.Cantidad}</td>
                        <td>{concepto.ValorUnitario}</td>
                        <td>{concepto.Descuento}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))}
                    </tbody>
                    <tfoot className = "bg-primary-dark-total text-white h-12">
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th className="text-right">Subtotal: 150,256</th>
                            <th>Descuento: 0</th>
                            <th>Retenciones: 0</th>
                            <th>Traslados: 20,560</th>
                            <th>Total: 170,789.00</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {children}
        </div>
    )
}


