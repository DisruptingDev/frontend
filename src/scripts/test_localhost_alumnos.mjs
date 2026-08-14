async function test() {
    try {
        const res = await fetch('http://127.0.0.1:3000/api/cobranza/alumnos?grupo_id=2');
        const text = await res.text();
        console.log("STATUS:", res.status);
        console.log("BODY START:", text.substring(0, 500));
        
        try {
            const data = JSON.parse(text);
            console.log("IS ARRAY:", Array.isArray(data));
            console.log("LENGTH:", Array.isArray(data) ? data.length : "N/A");
            if (data.error) console.log("ERROR MESSAGE:", data.error);
        } catch (e) {
            console.log("JSON PARSE ERROR:", e.message);
        }
    } catch (e) {
        console.error("FETCH ERROR:", e.message);
    }
}
test();
