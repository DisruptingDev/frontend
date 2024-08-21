import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"
import Button from "@mui/material/Button"; // Importa el componente Button de Material UI
import TextField from '@mui/material/TextField';


export default function Registro() {
    return (
        <main className="py-10 flex items-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500">
            <div className="card card-compact bg-gray-200/60 w-96 shadow-xl">
                <div className="card-body">

                    <div className="w-full flex justify-center">
                        <h2 className="card-title text-black text-center">¡Registra un cliente!</h2>
                    </div>

                    <div className="card-body">
                        <Input name="Nombre" type="text" placeholder="Ingresa el nombre del cliente" />
                        <Input name="RFC" type="text" placeholder="Ingresa el RFC del cliente" />
                        <Input name="Domicilio Fiscal" type="text" placeholder="Domicilio Fiscal" />
                        <Input name="Residencia Fiscal" type="text" placeholder="Residencia Fiscal" />

                        <Select name="Uso CFDI" url="http://localhost:8080/usocfdi" />
                        <Select name="Regimen Fiscal" url="http://localhost:8080/regimenfiscal" />
                        <TextField
                            label="Nombre"
                            variant="outlined"
                            fullWidth
                        />
                    </div>

                    <div className="card-actions justify-center">
                        <Button variant="contained" color="primary">
                            Registrarse
                        </Button>
                    </div>
                </div>
            </div>
        </main>
    );
}
