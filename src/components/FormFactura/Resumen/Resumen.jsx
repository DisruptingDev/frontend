import Input from "@/components/Input/Input.jsx"
import {Select, SelectNoLabel} from "@/components/Select/Select.jsx"

export default function Resumen() {
    return (
        <div className = "bg-white mx-4 p-4 shadow-xl rounded-md m-100">
            <h3 className = "card-title mb-6">Resumen</h3>
            <div className = "grid grid-cols-1 gap-6">
                <table className="table table-md">
                    <thead className = "bg-primary-dark-total text-white h-12">
                      <tr>
                        <th></th>
                        <th>Clave Prod.</th>
                        <th>Clave Serv.</th>
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
                      <tr>
                        <th>1</th>
                        <td>81235980</td>
                        <td>H68</td>
                        <td>Diseño de Software a la medida</td>
                        <td>1</td>
                        <td>25,000</td>
                        <td>0</td>
                        <td>4,000</td>
                        <td>0</td>
                        <td>29,000</td>
                      </tr>
                      <tr>
                        <th>1</th>
                        <td>81235980</td>
                        <td>H68</td>
                        <td>Diseño de Software a la medida</td>
                        <td>1</td>
                        <td>25,000</td>
                        <td>0</td>
                        <td>4,000</td>
                        <td>0</td>
                        <td>29,000</td>
                      </tr>
                      <tr>
                        <th>1</th>
                        <td>81235980</td>
                        <td>H68</td>
                        <td>Diseño de Software a la medida</td>
                        <td>1</td>
                        <td>25,000</td>
                        <td>0</td>
                        <td>4,000</td>
                        <td>0</td>
                        <td>29,000</td>
                      </tr>
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
            <div className = "flex justify-end w-full mt-10 space-x-2">
                <button className="btn btn-secondary bg-red-700">Cancelar</button>
                <button className="btn btn-accent">Vista previa</button>
                <button className="btn btn-primary bg-primary-dark-total">Crear Factura</button>
            </div>
        </div>
    )
}


