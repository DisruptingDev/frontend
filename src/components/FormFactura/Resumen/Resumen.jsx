import Input from "@/components/Input/Input.jsx"
import {Select, SelectNoLabel} from "@/components/Select/Select.jsx"
import { CalculosFinales } from "./Calculos/Calculo.js"

export default function Resumen( {children, conceptos, subTotal, Descuento} ) {

    let finales = CalculosFinales(conceptos)

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
                          <td>{concepto.Subtotal + concepto.TotalTraslados + concepto.TotalRetenciones}</td>
                        </tr>
                    ))}
                    </tbody>
                    <tfoot className = "bg-primary-dark-total text-white h-12">
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th className="text-right">Subtotal: {finales.SubTotalFinal}</th>
                            <th>Descuento: {finales.DescuentoFinal}</th>
                            <th>Retenciones: {finales.RetencionesFinal}</th>
                            <th>Traslados: {finales.TrasladosFinal}</th>
                            <th>Total: {finales.TotalFinal}</th>
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


