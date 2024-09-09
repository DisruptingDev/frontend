"use client"
import Input from "@/components/Input/Input.jsx";
import { Select, SelectNoLabel } from "@/components/Select/Select.jsx";
import { CalculosFinales } from "./Calculos/Calculo.js";

export default function Resumen({ children, conceptos, subTotal, Descuento, handleEditConcepto, handleDeleteConcepto }) {
    let finales = CalculosFinales(conceptos);

    return (
        <div className="bg-white mx-4 p-4 shadow-xl rounded-md m-100">
            <h3 className="card-title mb-6">Resumen</h3>
            <div className="grid grid-cols-1 gap-6">
                <table className="table table-md">
                    <thead className="bg-primary-dark-total text-white h-12">
                        <tr>
                            <th>#</th>
                            <th>Clave Prod.</th>
                            <th>Clave Unidad.</th>
                            <th>Concepto</th>
                            <th>Cantidad</th>
                            <th>Precio Unitario</th>
                            <th>Descuento</th>
                            <th>Traslados</th>
                            <th>Retenciones</th>
                            <th>Monto</th>
                            <th>Acciones</th> {/* Columna para acciones */}
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
                                <td>
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
                    <tfoot className="bg-primary-dark-total text-white h-12">
                        <tr>
                            <th colSpan="3"></th>
                            <th className="text-right">Subtotal: {finales.SubTotalFinal}</th>
                            <th>Descuento: {finales.DescuentoFinal}</th>
                            <th>Retenciones: {finales.RetencionesFinal}</th>
                            <th>Traslados: {finales.TrasladosFinal}</th>
                            <th>Total: {finales.TotalFinal}</th>
                            <th colSpan="3"></th>
                        </tr>
                    </tfoot>
                </table>
            </div>
            {children}
        </div>
    );
}
