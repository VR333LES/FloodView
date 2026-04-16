import dynamic from 'next/dynamic';
import { promises as fs } from 'fs';
import path from 'path';

// Load map component dynamically to avoid SSR errors with Leaflet
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-gray-100 animate-pulse rounded-lg flex items-center justify-center text-gray-500">Loading Map...</div>,
});

interface DataPoint {
  lat: number;
  lng: number;
  label: string;
  type: 'safe' | 'danger' | 'flood';
  value?: string;
}

// Simple but robust CSV parser that handles quoted commas
function parseCSVLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function getElevationPoints(): Promise<DataPoint[]> {
  const filePath = path.join(process.cwd(), 'public', 'Elevation NYC.csv');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const lines = fileContents.split('\n');
    const headers = parseCSVLine(lines[0]);
    const points: DataPoint[] = [];

    // Find indices for Latitude, Longitude, and ELEVATION
    const latIdx = headers.findIndex(h => h.toUpperCase().includes('LATITUDE'));
    const lngIdx = headers.findIndex(h => h.toUpperCase().includes('LONGITUDE'));
    const elevIdx = headers.findIndex(h => h.toUpperCase().includes('ELEVATION'));

    // Sample data from across the entire file to ensure geographic coverage
    const step = Math.max(1, Math.floor(lines.length / 3000));
    for (let i = 1; i < lines.length && points.length < 2500; i += step) {
      if (lines[i].trim() === '') continue;
      const values = parseCSVLine(lines[i]);
      const lat = parseFloat(values[latIdx]);
      const lng = parseFloat(values[lngIdx]);
      const elevation = parseFloat(values[elevIdx]);

      if (isNaN(lat) || isNaN(lng) || isNaN(elevation)) continue;

      if (elevation > 20) {
        points.push({
          lat,
          lng,
          label: `Elevation Point`,
          type: 'safe',
          value: `Elevation: ${elevation.toFixed(2)} ft`
        });
      } else if (elevation < 10) {
        points.push({
          lat,
          lng,
          label: `Low Elevation Point`,
          type: 'danger',
          value: `Elevation: ${elevation.toFixed(2)} ft`
        });
      }
    }
    return points;
  } catch (error) {
    console.error('Error reading elevation data:', error);
    return [];
  }
}

async function getFloodPoints(): Promise<DataPoint[]> {
  const filePath = path.join(process.cwd(), 'public', 'Street_Flooding_20260302.csv');
  try {
    const fileContents = await fs.readFile(filePath, 'utf8');
    const lines = fileContents.split('\n');
    const headers = parseCSVLine(lines[0]);
    const points: DataPoint[] = [];

    const latIdx = headers.findIndex(h => h.toUpperCase().includes('LATITUDE'));
    const lngIdx = headers.findIndex(h => h.toUpperCase().includes('LONGITUDE'));
    const addrIdx = headers.findIndex(h => h.toUpperCase().includes('INCIDENT ADDRESS'));
    const statusIdx = headers.findIndex(h => h.toUpperCase().includes('STATUS'));

    // Sample from across the entire flood dataset
    const step = Math.max(1, Math.floor(lines.length / 2000));
    for (let i = 1; i < lines.length && points.length < 1500; i += step) {
      if (lines[i].trim() === '') continue;
      const values = parseCSVLine(lines[i]);
      const lat = parseFloat(values[latIdx]);
      const lng = parseFloat(values[lngIdx]);
      const address = values[addrIdx] || 'Unknown Address';
      const status = values[statusIdx] || 'Unknown Status';

      if (isNaN(lat) || isNaN(lng)) continue;

      points.push({
        lat,
        lng,
        label: `Flood Report: ${address}`,
        type: 'flood',
        value: `Status: ${status}`
      });
    }
    return points;
  } catch (error) {
    console.error('Error reading flood data:', error);
    return [];
  }
}

export default async function EvacuationMapPage() {
  const elevationPoints = await getElevationPoints();
  const floodPoints = await getFloodPoints();
  const allPoints = [...elevationPoints, ...floodPoints];

  return (
    <main className="flex min-h-screen flex-col items-center p-8 lg:p-24 bg-white dark:bg-zinc-950">
      <div className="z-10 max-w-6xl w-full flex flex-col gap-8">
        <div className="flex flex-col gap-2 text-center items-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            NYC Category 4 Evacuation Escape Map - Harlem Focus
          </h1>
          <p className="max-w-2xl text-lg text-gray-600 dark:text-zinc-400">
            Identifying safe zones and potential flood hotspots in Harlem and surrounding areas based on elevation and historical flood reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/20 dark:border-green-900/50">
            <h3 className="text-green-800 dark:text-green-400 font-bold flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full inline-block"></span>
              Safe Zones
            </h3>
            <p className="text-sm text-green-700 dark:text-green-500/80">Elevation above 20 ft. Likely safe from Category 4 storm surge.</p>
          </div>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-950/20 dark:border-red-900/50">
            <h3 className="text-red-800 dark:text-red-400 font-bold flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full inline-block"></span>
              Danger Zones
            </h3>
            <p className="text-sm text-red-700 dark:text-red-500/80">Elevation below 10 ft. High risk of storm surge flooding.</p>
          </div>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-950/20 dark:border-orange-900/50">
            <h3 className="text-orange-800 dark:text-orange-400 font-bold flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full inline-block"></span>
              Flood Reports
            </h3>
            <p className="text-sm text-orange-700 dark:text-orange-500/80">Historical street flooding hotspots to avoid during heavy rain.</p>
          </div>
        </div>

        <div className="w-full h-[600px] relative overflow-hidden shadow-2xl rounded-xl border border-gray-200 dark:border-zinc-800">
          <MapComponent points={allPoints} />
        </div>

        <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-lg border border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Safety Information</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-zinc-400">
            <li>A Category 4 storm surge can reach up to 18 feet in some areas of NYC.</li>
            <li>If you are in a &quot;Danger Zone&quot; or live in a basement apartment, plan your evacuation route to a &quot;Safe Zone&quot; early.</li>
            <li>Avoid historical hotspots during the storm as these are prone to rapid street flooding even before the surge hits.</li>
            <li>Check your local evacuation zone at <a href="https://on.nyc.gov/knowyourzone" target="_blank" className="text-blue-600 hover:underline">NYC.gov/KnowYourZone</a>.</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
