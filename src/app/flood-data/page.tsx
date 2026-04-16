import { promises as fs } from 'fs';
import path from 'path';

interface FloodReport {
  'Unique Key': string;
  'Created Date': string;
  'Closed Date': string;
  'Agency': string;
  'Problem (formerly Complaint Type)': string;
  'Incident Zip': string;
  'Incident Address': string;
  'Street Name': string;
  'Borough': string;
  'Latitude': string;
  'Longitude': string;
  'Status': string;
}

async function getFloodData(): Promise<FloodReport[]> {
  const filePath = path.join(process.cwd(), 'public', 'Street_Flooding_20260302.csv');
  const fileContents = await fs.readFile(filePath, 'utf8');
  const lines = fileContents.split('\n');
  const headers = lines[0].split(',');
  const data: FloodReport[] = [];

  for (let i = 1; i < lines.length && i <= 100; i++) { // Limit to 100 for performance
    if (lines[i].trim() === '') continue;
    const values = lines[i].split(',');
    const obj: any = {};
    headers.forEach((header, index) => {
      obj[header.replace(/"/g, '')] = values[index]?.replace(/"/g, '') || '';
    });
    data.push(obj as FloodReport);
  }

  return data;
}

export default async function FloodDataPage() {
  const floodData = await getFloodData();

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">Street Flooding Reports - NYC</h1>
      <div className="w-full max-w-6xl">
        <table className="w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2">Created Date</th>
              <th className="border border-gray-300 px-4 py-2">Street Name</th>
              <th className="border border-gray-300 px-4 py-2">Borough</th>
              <th className="border border-gray-300 px-4 py-2">Incident Address</th>
              <th className="border border-gray-300 px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {floodData.slice(0, 20).map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2">{report['Created Date']}</td>
                <td className="border border-gray-300 px-4 py-2">{report['Street Name']}</td>
                <td className="border border-gray-300 px-4 py-2">{report['Borough']}</td>
                <td className="border border-gray-300 px-4 py-2">{report['Incident Address']}</td>
                <td className="border border-gray-300 px-4 py-2">{report['Status']}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-sm text-gray-600">Showing first 20 reports. Full data available in CSV.</p>
      </div>
    </main>
  );
}