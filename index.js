const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parse');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files
app.use(express.static('public'));

// Global variable to store CSV data
let globalCsvData = [];

// Function to load CSV data into memory - now with streaming for better performance
async function loadCSV(csvFolder) {
    const dados = [];
    const files = fs.readdirSync(csvFolder).filter(file => file.endsWith('.csv'));
    
    for (const file of files) {
        const filePath = path.join(csvFolder, file);
        
        await new Promise((resolve, reject) => {
            const parser = csv.parse({
                delimiter: ';',
                skip_empty_lines: true,
                from_line: 2 // Skip header line
            });

            fs.createReadStream(filePath, { encoding: 'utf-8' })
                .pipe(parser)
                .on('data', (line) => {
                    if (line.length > 17) {
                        dados.push({
                            nota: line[17].trim(),
                            nome_aluno: line[11].trim().toLowerCase(),
                            instituicao: line[1].trim(),
                            curso: line[6].trim(),
                            no_campus: line[4].trim()
                        });
                    }
                })
                .on('error', reject)
                .on('end', resolve);
        });
    }
    
    return dados;
}

// Optimized search function using Set for faster lookups
function searchNamesInCSV(names, data) {
    const nameSet = new Set(names.map(name => name.trim().toLowerCase()));
    return data.filter(student => 
        Array.from(nameSet).some(name => student.nome_aluno.includes(name))
    );
}

// Initialize data at server startup
async function initializeData() {
    try {
        console.log('Loading CSV data...');
        const startTime = Date.now();
        globalCsvData = await loadCSV("csv");
        const endTime = Date.now();
        console.log(`CSV data loaded successfully in ${endTime - startTime}ms. Total records: ${globalCsvData.length}`);
    } catch (error) {
        console.error('Error loading CSV data:', error);
        process.exit(1);
    }
}

// Root endpoint - serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Search endpoint - now using pre-loaded data
app.get('/buscar', (req, res) => {
    const names = req.query.nomes;
    
    if (!names) {
        return res.status(400).json({
            error: "Por favor, forneça os nomes na URL, por exemplo: ?nomes=João;Maria"
        });
    }
    
    try {
        const nameList = names.split(';');
        const results = searchNamesInCSV(nameList, globalCsvData);
        
        return res.json({ resultados: results });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: "Erro interno do servidor"
        });
    }
});

// Start server after loading data
const PORT = 8080;

// Create public directory if it doesn't exist
if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
}

initializeData().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});