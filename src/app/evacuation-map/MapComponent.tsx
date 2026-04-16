"use client";

import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents, Polyline, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';
import L from 'leaflet';
import { useEffect, useState } from 'react';
import { OpenStreetMapProvider, GeoSearchControl } from 'leaflet-geosearch';

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

// Distance calculation (Haversine formula)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function SearchField({ onLocationFound }: { onLocationFound: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    // @ts-ignore
    const searchControl = new GeoSearchControl({
      provider: provider,
      style: 'bar',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Enter address to find nearest safe zone...',
    });

    map.addControl(searchControl);
    
    map.on('geosearch/showlocation', (result: any) => {
      onLocationFound(result.location.y, result.location.x);
    });

    return () => { map.removeControl(searchControl); };
  }, [map, onLocationFound]);

  return null;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ points }: MapComponentProps) {
  const [mounted, setMounted] = useState(false);
  const [startPoint, setStartPoint] = useState<[number, number] | null>(null);
  const [evacRoute, setEvacRoute] = useState<[number, number][] | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    fixLeafletIcons();
    setMounted(true);
  }, []);

  const handleLocationSelected = (lat: number, lng: number) => {
    setStartPoint([lat, lng]);
    
    // Find nearest safe zone
    const safePoints = points.filter(p => p.type === 'safe');
    if (safePoints.length === 0) return;

    let nearest = safePoints[0];
    let minDiff = getDistance(lat, lng, nearest.lat, nearest.lng);

    safePoints.forEach(p => {
      const diff = getDistance(lat, lng, p.lat, p.lng);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = p;
      }
    });

    setEvacRoute([[lat, lng], [nearest.lat, nearest.lng]]);
    setDistance(minDiff);
  };

  if (!mounted) return null;

  const center: [number, number] = [40.8116, -73.9465]; // Harlem, Manhattan

  return (
    <div style={{ height: '700px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '2px solid #333' }}>
      <MapContainer 
        center={center} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <SearchField onLocationFound={handleLocationSelected} />
        <MapClickHandler onClick={handleLocationSelected} />

        {points
          .sort((a, b) => {
            const order = { 'flood': 1, 'danger': 2, 'safe': 3 };
            return order[a.type] - order[b.type];
          })
          .map((point, index) => (
          <CircleMarker
            key={index}
            center={[point.lat, point.lng]}
            pathOptions={{
              color: point.type === 'safe' ? '#00ff00' : point.type === 'danger' ? '#ff0000' : '#ff8c00',
              fillColor: point.type === 'safe' ? '#00ff00' : point.type === 'danger' ? '#ff0000' : '#ff8c00',
              fillOpacity: point.type === 'safe' ? 0.9 : 0.6
            }}
            radius={point.type === 'safe' ? 10 : 4}
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

        {startPoint && (
          <Marker position={startPoint}>
            <Popup>
              <div className="font-sans font-bold text-blue-600">Your Location / Evacuation Start</div>
            </Popup>
          </Marker>
        )}

        {evacRoute && (
          <Polyline 
            positions={evacRoute} 
            pathOptions={{ color: '#2563eb', weight: 4, dashArray: '10, 10' }} 
          >
            <Popup>
              <div className="font-sans">
                <p className="font-bold text-blue-700 underline">Evacuation Vector</p>
                <p className="text-sm">Distance to nearest safe zone: <span className="font-bold">{distance?.toFixed(2)} miles</span></p>
                <p className="text-xs text-gray-500 mt-1">Move toward the green markers for higher ground.</p>
              </div>
            </Popup>
          </Polyline>
        )}

        <ChangeView center={center} zoom={14} />
      </MapContainer>
    </div>
  );
}
