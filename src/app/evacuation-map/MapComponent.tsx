"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icons in Leaflet with Next.js
const fixLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

interface DataPoint {
  lat: number;
  lng: number;
  label: string;
  type: 'safe' | 'danger' | 'flood';
  value?: string;
}

interface MapComponentProps {
  points: DataPoint[];
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapComponent({ points }: MapComponentProps) {
  useEffect(() => {
    fixLeafletIcons();
  }, []);

  const center: [number, number] = [40.7128, -74.0060]; // NYC Center

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ccc' }}>
      <MapContainer center={center} zoom={11} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map((point, index) => (
          <CircleMarker
            key={index}
            center={[point.lat, point.lng]}
            pathOptions={{
              color: point.type === 'safe' ? '#22c55e' : point.type === 'danger' ? '#ef4444' : '#f97316',
              fillColor: point.type === 'safe' ? '#22c55e' : point.type === 'danger' ? '#ef4444' : '#f97316',
              fillOpacity: 0.6
            }}
            radius={point.type === 'safe' ? 6 : 8}
          >
            <Popup>
              <div className="font-sans">
                <p className="font-bold">{point.label}</p>
                <p className="text-sm">{point.value}</p>
                <p className={`text-xs mt-1 font-semibold ${point.type === 'safe' ? 'text-green-600' : 'text-red-600'}`}>
                  {point.type === 'safe' ? 'SAFE ZONE (High Elevation)' : point.type === 'danger' ? 'DANGER ZONE (Low Elevation)' : 'FLOOD REPORT'}
                </p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
        <ChangeView center={center} zoom={11} />
      </MapContainer>
    </div>
  );
}
