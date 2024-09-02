"use client"
export default function Input( {name, type, placeholder, className = ""} ) {
    return (
        <div>
            <input type={ type } placeholder={ placeholder } className={`input input-bordered input-primary w-full max-w-xs ${className}`} />
        </div>
    )
}
//<label className="font-bold text-gray-700">{ name }</label> 
