const http = require('http');

http.get('http://127.0.0.1:3000/api/cobranza/alumnos?grupo_id=2', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        if (res.statusCode === 500) {
            console.log("SERVER ERROR BODY:", data.substring(0, 500));
        } else {
            try {
                const json = JSON.parse(data);
                console.log(`IS ARRAY: ${Array.isArray(json)}`);
                if (Array.isArray(json)) {
                    console.log(`LENGTH: ${json.length}`);
                } else {
                    console.log(`DATA ERROR:`, json.error || "No error field");
                }
            } catch(e) {
                console.log(`PARSE ERROR: ${e.message}`);
                console.log(`BODY START: ${data.substring(0, 200)}`);
            }
        }
    });
}).on('error', (err) => {
    console.log("HTTP REQUEST ERROR:", err.message);
});
