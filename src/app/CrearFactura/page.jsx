import Header from "@/components/Header/Header.jsx"
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx"
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx"
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx"
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx"

export default function CrearFactura() {
  return (
        <div>
            <Header /> 
            <form action="localhost:8080/EmisionTimbrado" method="post">
                <Emisor /> 
                <Receptor /> 
                <Conceptos /> 
                <Resumen /> 
            </form>
        </div>
  );
}

