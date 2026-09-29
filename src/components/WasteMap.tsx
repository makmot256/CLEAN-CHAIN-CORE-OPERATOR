import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient"; // adjust path if different

type MarkerData = {
  id: number;
  latitude: number;
  longitude: number;
  waste_type: string;
  status: string;
};

import { useMapEvents } from "react-leaflet";

/*const SetMapCenter = ({ center }: { center: [number, number] }) => {
  const map = useMap();

  useEffect(() => {
    const [lat, lng] = center;
    if (map && !isNaN(lat) && !isNaN(lng)) {
      map.setView([lat, lng], map.getZoom());
    }
  }, [center, map]);

  return null;

};*/

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL(
    "leaflet/dist/images/marker-icon-2x.png",
    import.meta.url,
  ).href,
  iconUrl: new URL("leaflet/dist/images/marker-icon.png", import.meta.url).href,
  shadowUrl: new URL("leaflet/dist/images/marker-shadow.png", import.meta.url)
    .href,
});
///start
const MapClickHandler = ({
  onClick,
}: {
  onClick: (latlng: [number, number]) => void;
}) => {
  useMapEvents({
    click(e) {
      const coords: [number, number] = [e.latlng.lat, e.latlng.lng];
      onClick(coords);
    },
  });
  return null;
};

const WasteMap = () => {
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  // Scroll-to-zoom is only armed once the user deliberately interacts with the
  // map, so scrolling the page over it never hijacks the wheel and shifts the map.
  const [scrollZoomEnabled, setScrollZoomEnabled] = useState(false);

  useEffect(() => {
    const fetchMarkers = async () => {
      const { data, error } = await supabase.from("waste_table").select("*");
      if (error) {
        console.error("Error fetching markers:", error.message);
      } else {
        setMarkers(data);
      }
    };

    fetchMarkers();
  }, []);

  const center: [number, number] = [0.3476, 32.5825]; // Kampala coordinates for example
  // Optional safeguard
  // ✅ Add this guard check just below center declaration
  if (!center || isNaN(center[0]) || isNaN(center[1])) {
    return <div>Loading map...</div>;
  }

  return (
    <div
      className="relative h-full w-full"
      onMouseEnter={() => setScrollZoomEnabled(true)}
      onMouseLeave={() => setScrollZoomEnabled(false)}
    >
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={scrollZoomEnabled}
        style={{ height: "100%", width: "100%" }}
        className="h-full w-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Render markers fetched from DB */}
        {markers.map((point) => (
          <Marker key={point.id} position={[point.latitude, point.longitude]}>
            <Popup>
              {point.waste_type}
              <br />
              Type: {point.waste_type}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {!scrollZoomEnabled && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-gray-900/70 px-3 py-1 text-xs text-white">
          Hover the map, then scroll to zoom
        </div>
      )}
    </div>
  );
};

export default WasteMap;
