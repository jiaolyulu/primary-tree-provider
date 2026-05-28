import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePath = join(root, "lib", "tree-provider-rows.ts");
const outputRoot = join(root, "public", "provider-index");
const gridRoot = join(outputRoot, "grid");
const zipRoot = join(outputRoot, "zip");
const manifestPath = join(root, "lib", "provider-index-manifest.json");
const cellSizeDegrees = 0.02;

async function loadRows() {
  try {
    const source = await readFile(sourcePath, "utf8");
    const marker = "export const treeProviderRows = ";
    const start = source.indexOf(marker);
    if (start === -1) {
      throw new Error(`Could not find treeProviderRows export in ${sourcePath}`);
    }

    const jsonStart = start + marker.length;
    const jsonEnd = source.indexOf(" satisfies", jsonStart);
    if (jsonEnd === -1) {
      throw new Error(`Could not find treeProviderRows terminator in ${sourcePath}`);
    }

    return JSON.parse(source.slice(jsonStart, jsonEnd));
  } catch {
    try {
      const zipPath = join(outputRoot, "zip");
      const files = await readdir(zipPath);
      const buckets = await Promise.all(
        files.filter((file) => file.endsWith(".json")).map((file) => readFile(join(zipPath, file), "utf8")),
      );
      return buckets.flatMap((content) => JSON.parse(content));
    } catch {
      // Fall through to NYC Open Data when neither the source TS fixture nor an existing index is present.
    }

    const endpoint = new URL("https://data.cityofnewyork.us/resource/uvpi-gqnh.json");
    endpoint.searchParams.set("$limit", "50000");
    endpoint.searchParams.set(
      "$select",
      "tree_id,spc_common,spc_latin,address,zipcode,zip_city,nta_name,boroname,state,latitude,longitude,status,health,tree_dbh,steward,guards,sidewalk,problems",
    );
    endpoint.searchParams.set(
      "$where",
      "status='Alive' AND latitude IS NOT NULL AND longitude IS NOT NULL AND spc_common IS NOT NULL",
    );

    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`NYC Open Data request failed: ${response.status} ${response.statusText}`);
    }

    const records = await response.json();
    return records.map((record) => [
      Number(record.tree_id),
      record.spc_common || "Unknown tree",
      record.spc_latin || "Species pending",
      record.address || "Documented NYC street tree",
      String(record.zipcode || ""),
      record.zip_city || record.boroname || "New York",
      record.nta_name || record.boroname || "NYC",
      Number(record.latitude),
      Number(record.longitude),
      Number(record.tree_dbh || 1),
      record.health || "Fair",
      record.steward || "None",
      record.guards || "None",
      record.sidewalk || "NoDamage",
      record.problems || "None",
    ]);
  }
}

function gridKey(latitude, longitude) {
  return `${Math.floor(latitude / cellSizeDegrees)}_${Math.floor(longitude / cellSizeDegrees)}`;
}

function addToBucket(map, key, row) {
  const bucket = map.get(key);
  if (bucket) {
    bucket.push(row);
  } else {
    map.set(key, [row]);
  }
}

async function writeJson(path, data) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(data)}\n`);
}

const rows = await loadRows();
const zipBuckets = new Map();
const gridBuckets = new Map();
const species = new Set();
const neighborhoods = new Set();

for (const row of rows) {
  addToBucket(zipBuckets, String(row[4]), row);
  addToBucket(gridBuckets, gridKey(row[7], row[8]), row);
  species.add(row[1]);
  neighborhoods.add(row[6]);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(gridRoot, { recursive: true });
await mkdir(zipRoot, { recursive: true });

for (const [key, bucket] of gridBuckets) {
  await writeJson(join(gridRoot, `${key}.json`), bucket);
}

for (const [zipcode, bucket] of zipBuckets) {
  await writeJson(join(zipRoot, `${zipcode}.json`), bucket);
}

const manifest = {
  cellSizeDegrees,
  gridCells: [...gridBuckets.keys()].sort(),
  speciesCount: species.size,
  totalProviders: rows.length,
  neighborhoods: neighborhoods.size,
  zipcodes: [...zipBuckets.keys()].sort(),
};

await writeJson(join(outputRoot, "manifest.json"), manifest);
await writeJson(manifestPath, manifest);

console.log(`Indexed ${rows.length} providers into ${gridBuckets.size} grid cells and ${zipBuckets.size} ZIP shards.`);
