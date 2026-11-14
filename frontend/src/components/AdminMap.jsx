import { useMemo, useEffect, useState, useRef } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const busIcon = new L.Icon({
    iconUrl: '/markers/bus.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
});

const sosIcon = new L.Icon({
    iconUrl: '/markers/bus.png',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
    className: 'animate-pulse'
});

// Auto-fit bounds on initial load or manual trigger
const FitBounds = ({ buses, triggerRecenter }) => {
    const map = useMap();
    const hasFittedRef = useRef(false);

    useEffect(() => {
        if (!map || buses.length === 0) return;

        const bounds = buses
            .filter(b => b?.lat && b?.lng)
            .map(b => [b.lat, b.lng]);

        if (bounds.length > 0 && (!hasFittedRef.current || triggerRecenter > 0)) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
            hasFittedRef.current = true;
        }
    }, [buses, map, triggerRecenter]);

    return null;
};

const AdminMap = ({ buses = [], sosTrips = [], onBusClick }) => {
    const defaultCenter = { lat: 17.385, lng: 78.4867 };
    const [recenterCount, setRecenterCount] = useState(0);

    const activeBuses = useMemo(() =>
        buses.filter(b => b.lastPosition?.lat && b.lastPosition?.lng),
        [buses]
    );

    const sosSet = useMemo(() =>
        new Set(sosTrips.map(t => t.tripId)),
        [sosTrips]
    );

    return (
        <div className="relative w-full h-full min-h-[300px]">
            {activeBuses.length > 0 && (
                <button
                    type="button"
                    onClick={() => setRecenterCount(c => c + 1)}
                    className="absolute top-3 right-3 z-[1000] text-xs px-3 py-1.5 rounded-lg bg-white/95 hover:bg-white text-[#292522] border border-[#A5A79B]/40 font-medium transition shadow-md flex items-center gap-1.5"
                    title="Fit all active buses in view"
                >
                    <span>🎯</span> Recenter Fleet
                </button>
            )}

            <MapContainer
                center={activeBuses[0]?.lastPosition || defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%', minHeight: '300px' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                />

                <FitBounds buses={activeBuses.map(b => b.lastPosition)} triggerRecenter={recenterCount} />

                {activeBuses.map(bus => {
                    const isSOS = sosSet.has(bus.tripId);
                    const pos = [bus.lastPosition.lat, bus.lastPosition.lng];

                    return (
                        <Marker
                            key={bus._id}
                            position={pos}
                            icon={isSOS ? sosIcon : busIcon}
                            eventHandlers={{
                                click: () => onBusClick?.(bus)
                            }}
                        >
                            <Popup>
                                <div className="min-w-[150px]">
                                    <p className="font-bold text-sm">{bus.name || 'Unknown Bus'}</p>
                                    <p className="text-xs text-gray-600">{bus.numberPlate}</p>
                                    {bus.driverName && (
                                        <p className="text-xs mt-1">Driver: {bus.driverName}</p>
                                    )}
                                    {isSOS && (
                                        <p className="text-xs text-red-600 font-bold mt-1">⚠️ SOS ACTIVE</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {bus.studentCount || 0} students tracking
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default AdminMap;
