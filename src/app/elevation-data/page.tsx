import { promises as fs } from 'fs';
import path from 'path';

interface ElevationPoint {
  Longitude: string;
  Latitude: string;
  ELEVATION: string;
}

async function getElevationData(): Promise<ElevationPoint[]> {
  const filePath = path.join(process.cwd(), 'public', 'Elevation NYC.csv');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const lines = fileContents.split('\n');
  const headers = lines[0].split(',');
  const data: ElevationPoint[] = [];

  for (let i = 1; i < lines.length && i <= 100; i++) { // Limit to 100 for performance
    if (lines[i].trim() === '') continue;
    const values = lines[i].split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header.replace(/"/g, '')] = values[index]?.replace(/"/g, '') || '';
    });
    data.push(obj as ElevationPoint);
  }

  return data;
}

export default async function ElevationDataPage() {
  const elevationData = await getElevationData();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Elevation Data - NYC</h1>
      <p className="mb-4 text-center">Elevation points across NYC (in feet, negative values below sea level). Useful for flood risk assessment.</p>
      <div className="w-full max-w-6xl">
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Latitude</th>
              <th className="border border-gray-300 px-4 py-2">Longitude</th>
              <th className="border border-gray-300 px-4 py-2">Elevation (ft)</th>
            </tr>
          </thead>
          <tbody>
            {elevationData.map((point, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{point.Latitude}</td>
                <td className="border border-gray-300 px-4 py-2">{point.Longitude}</td>
                <td className="border border-gray-300 px-4 py-2">{parseFloat(point.ELEVATION).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-gray-600">Showing elevation data points. Full dataset available in CSV.</p>
      </div>
    </main>
  );
}