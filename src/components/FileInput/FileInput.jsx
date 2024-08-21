export default function FileInput( {name} ) {
    return (
        <div>
            <label className="form-control w-full h-full">
                <div className="label">
                    <span className="label-text text-black">{name}</span>
                </div>
                <input type="file" className="file-input file-input-bordered w-full"  />
            </label>
        </div>
    )
}

