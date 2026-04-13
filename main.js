import dotenv from 'dotenv';
import fs from "fs";
import path from "path";
import readline from "readline";

dotenv.config();

const srcFolder = "./data-to-convert";
const outFolder = "./converted-data";
const apiUrl = process.env.API_URL;


function delay(n) {
  return new Promise(function(resolve) {
    setTimeout(resolve, n * 1000);
  });
}


function logNotFoundAddress(address) {
    const filepath = `${outFolder}/not-found-addresses.txt`;

    if (!fs.existsSync(filepath)) {
        fs.writeFileSync(filepath, `${address}\n`);
    } else {
        fs.appendFileSync(filepath, `${address}\n`);
    }
}


async function extractGeojsonFromCsv(file) {
    const geojson = [];

    // Open .csv file
    const filestream = fs.createReadStream(`${srcFolder}/${file}`);
    const rl = readline.createInterface({
        input: filestream,
        crlfDelay: Infinity, // This handles all newline character variations
    });

    // For each .csv line
    let lineCount = 0;
    for await (const line of rl) {

        // Jump over header line
        if (lineCount < 1) {
            lineCount++;
            continue;
        }

        // Get address from first column
        const [address] = line.split(',');
        if (!address) {
            continue;
        }

        // Fetch coordinates from API
        try {
            const params = new URLSearchParams();
            params.append("format", "geojson");
            params.append("limit", "1");
            params.append("q", address);

            const reponse = await fetch(`${apiUrl}/search?${params}`);
            if (!reponse.ok) {
                throw new Error(`Response status: ${reponse.status}`);
            }

            const data = await reponse.json();
            if (data && data.features && data.features.length > 0) {
                const { type, geometry, bbox } = data.features[0]
                const [lon, lat] = geometry.coordinates
                geojson.push({
                    type: type,
                    title: address,
                    properties: {
                        "Collection Name": file,
                        "WEGO URL": `https://share.here.com/l/${lat},${lon}`,
                        "Location": {
                            "Address": address,
                            "Geo Coordinates": { "Latitude": lat, "Longitude": lon }
                        }
                    },
                    geometry: geometry,
                    bbox: bbox
                });
            } else {
                logNotFoundAddress(address);
            }
        } catch (err) {
            console.log("\n", 'Error for address:', address);
            console.log('Error for address:', address);
            console.error(err);
        }

        // Wait 2 sec because of API call restrictions
        await delay(2);

        lineCount++;
    }

    return geojson;
}


async function convertToGeojson(file) {
    console.log("\n");
    console.log(`Converting ${file}...`);

    // Extract geojson collection from file
    const geojson = await extractGeojsonFromCsv(file);

    // Generate new .geojson file
    const filepath = `${outFolder}/${path.parse(file).name}-converted.geojson`;
    fs.writeFileSync(
        filepath,
        JSON.stringify({ type: "FeatureCollection", features: geojson }),
    );

    console.log(`${file} converted !`);
}


try {
    console.log("Source folder:", srcFolder);
    console.log("Output folder:", outFolder);

    // Validate srcFolder existence
    if (!fs.existsSync(srcFolder)) {
        throw new Error(`Folder ${srcFolder} doesn't exist.`);
    }

    // Create outFolder existence
    if (!fs.existsSync(outFolder)) {
        fs.mkdirSync(outFolder);
    }

    // Read all csv files from srcFolder
    const files = fs.readdirSync(srcFolder).filter((file) => path.parse(file).ext === ".csv")
    for (const file of files) {
        await convertToGeojson(file);
    }

} catch (err) {
    console.error(err);
}
