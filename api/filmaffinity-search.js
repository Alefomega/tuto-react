// api/filmaffinity-search.js
export default async function handler(req, res) {
    const { stext } = req.query;

    if (!stext) {
        return res.status(400).json({ error: 'Falta el parámetro stext' });
    }

    try {
        const url = `https://www.filmaffinity.com/es/search.php?stype=title&stext=${encodeURIComponent(stext)}`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'es-ES,es;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ 
                error: `FilmAffinity respondió con error ${response.status}`,
                htmlCrudo: null
            });
        }

        const html = await response.text();

        // Raspar los primeros 10 resultados
        const resultados = [];
        
        // Regex para encontrar cada resultado - busca links con clase "movie" o similares
        const regexItems = /<div[^>]*class="[^"]*item[^"]*"[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>.*?<\/div>/gs;
        
        let match;
        let count = 0;

        while ((match = regexItems.exec(html)) && count < 10) {
            const url = match[1];
            const titulo = limpiar(match[2]);

            if (titulo) {
                // Intentar extraer el año si está disponible cerca del título
                const contexto = html.substring(match.index, match.index + 300);
                const anoMatch = contexto.match(/\((\d{4})\)/);
                const ano = anoMatch ? anoMatch[1] : null;

                resultados.push({
                    titulo: titulo,
                    ano: ano,
                    nota: null,
                    url: url.startsWith('http') ? url : `https://www.filmaffinity.com${url}`
                });
                count++;
            }
        }

        // Si el regex de arriba no funciona bien, intentar otro patrón
        if (resultados.length === 0) {
            const regexAlt = /<a[^>]*href="\/es\/(film|tv)[^"]*"[^>]*>([^<]+)<\/a>/g;
            while ((match = regexAlt.exec(html)) && count < 10) {
                const titulo = limpiar(match[2]);
                if (titulo && !resultados.some(r => r.titulo === titulo)) {
                    resultados.push({
                        titulo: titulo,
                        ano: null,
                        nota: null,
                        url: `https://www.filmaffinity.com${match[1]}`
                    });
                    count++;
                }
            }
        }

        return res.status(200).json({
            resultados: resultados,
            htmlCrudo: html
        });

    } catch (error) {
        return res.status(500).json({ 
            error: 'Error al hacer fetch a filmaffinity: ' + error.message,
            htmlCrudo: null
        });
    }
}

function limpiar(texto) {
    if (!texto) return null;
    return texto.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}
