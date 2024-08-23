export default function FileInput({ name, onChange }) {
    return (
        <div>
            <label className="form-control w-full h-full">
                <div className="label">
                    <span className="label-text text-black">{name}</span>
                </div>
                <input 
                    type="file" 
                    className="file-input file-input-bordered w-full" 
                    
                    onChange={onChange} // Llama al onChange que se pasa desde el componente padre
                />
            </label>
        </div>
    );
}
