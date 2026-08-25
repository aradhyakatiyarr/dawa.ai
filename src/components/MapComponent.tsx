"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PharmacyStore } from "@/data/stores";

// Fix Leaflet marker icon asset path issues in SPA bundlers
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom red icon for User Location
const UserIcon = L.icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to dynamically update map center when props change
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

interface MapComponentProps {
  stores: PharmacyStore[];
  center: [number, number];
  userLocation: [number, number] | null;
}

export default function MapComponent({ stores, center, userLocation }: MapComponentProps) {
  const mapZoom = 13;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden shadow-inner relative border border-slate-200">
      <MapContainer
        center={center}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
      >
        <ChangeView center={center} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Location Marker */}
        {userLocation && (
          <Marker position={userLocation} icon={UserIcon}>
            <Popup>
              <div className="font-semibold text-slate-800">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Pharmacy Store Markers */}
        {stores.map((store) => (
          <Marker key={store.id} position={[store.lat, store.lng]}>
            <Popup>
              <div className="p-1 max-w-[200px]">
                <h4 className="font-bold text-slate-900 text-sm leading-tight mb-1">{store.name}</h4>
                <p className="text-slate-600 text-xs mb-1">{store.address}</p>
                {store.phone && (
                  <p className="text-slate-700 text-xs font-medium mb-1">
                    📞 <a href={`tel:${store.phone}`} className="hover:underline">{store.phone}</a>
                  </p>
                )}
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${store.lat},${store.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-semibold text-xs inline-block mt-1 hover:underline"
                >
                  Get Directions &rarr;
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
