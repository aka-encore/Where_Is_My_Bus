import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowUp, ArrowDown, Trash2, GripVertical, MapPin, X, 
  Search, Loader2, Plus, Navigation 
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.pm';
import 'leaflet.pm/dist/leaflet.pm.css';
import '../styles/MapEditor.css';
import { lineToGeoJSON, markerToStop, reorderStopsAlongLine, reindexStops } from '../utils/mapUtils';
import { ELURU_CENTER, TILE_LAYER_ATTRIBUTION, TILE_LAYER_URL } from '../constants/geo';
import { api } from '../utils/api';

const DEFAULT_CENTER = [ELURU_CENTER.lat, ELURU_CENTER.lng];

const stopIcon = new L.Icon({
  iconUrl: '/markers/stop.png',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

// Custom Stop Name Modal Component
const StopNameModal = ({ isOpen, defaultName, onConfirm, onCancel }) => {
  const [name, setName] = useState(defaultName);
  const inputRef = useRef(null);

  useEffect(() => {
    setName(defaultName);
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [isOpen, defaultName]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(name.trim() || defaultName);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onKeyDown={handleKeyDown}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-slate-900 rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Name This Stop</h3>
              <p className="text-xs text-slate-400">Enter a name for the stop location</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 uppercase tracking-wider mb-2">
              Stop Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Street Station"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
              autoComplete="off"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800/50 border border-white/10 hover:bg-slate-700/50 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 shadow-lg shadow-blue-500/25 transition-all"
            >
              Add Stop
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SortableStopRow = ({ stop, index, updateStopName, removeStop }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : 'auto',
    position: 'relative'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-slate-800/60 p-3 transition-all hover:border-blue-500/30 hover:bg-slate-800/80"
    >
      <div {...attributes} {...listeners} className="cursor-grab text-slate-500 hover:text-slate-300 active:cursor-grabbing transition-colors">
        <GripVertical size={16} />
      </div>

      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-400/20 text-xs font-bold text-blue-400 border border-blue-500/20">
        {index + 1}
      </span>

      <input
        className="flex-1 bg-transparent text-sm font-medium text-white placeholder:text-slate-500 focus:outline-none"
        value={stop.name}
        onChange={(e) => updateStopName(stop.id, e.target.value)}
        placeholder="Name stop..."
      />

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
          onClick={() => removeStop(stop.id)}
          title="Remove stop"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

const MapEditor = ({ initialRoute = null, initialStops = [], onSave, panelContainerRef }) => {
  const mapNode = useRef(null);
  const mapInstance = useRef(null);
  const polylineLayer = useRef(null);
  const stopMarkers = useRef(new Map());
  const searchMarkerRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [routeGeom, setRouteGeom] = useState(initialRoute);
  const [stops, setStops] = useState(reindexStops(initialStops));
  const [nameEdits, setNameEdits] = useState({});
  const [error, setError] = useState('');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modal state for stop naming
  const [stopModal, setStopModal] = useState({ 
    isOpen: false, 
    defaultName: '', 
    mode: 'create', // 'create' or 'edit'
    stopId: null,
    pendingLayer: null 
  });

  const sortedStops = useMemo(() => reindexStops(stops), [stops]);

  // Debounced place search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/routes/search-places?q=${encodeURIComponent(q)}`);
        setSearchResults(res.data || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Search place error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle modal confirm for creating new stop
  const handleStopNameConfirm = (name) => {
    if (stopModal.mode === 'create' && stopModal.pendingLayer) {
      const layer = stopModal.pendingLayer;
      const stop = markerToStop(layer, stops.length, name);
      layer.__stopId = stop.id;
      stopMarkers.current.set(stop.id, layer);
      attachMarkerHandlers(layer, stop.id);
      setStops((prev) => reorderStopsAlongLine(routeGeom, [...prev, stop]));
    } else if (stopModal.mode === 'edit' && stopModal.stopId) {
      const stopId = stopModal.stopId;
      setStops((prev) => prev.map((stop) => (stop.id === stopId ? { ...stop, name } : stop)));
      setNameEdits((prevNames) => ({ ...prevNames, [stopId]: name }));
      const marker = stopMarkers.current.get(stopId);
      if (marker) {
        marker.bindPopup(`<strong>${name}</strong>`);
      }
    }
    setStopModal({ isOpen: false, defaultName: '', mode: 'create', stopId: null, pendingLayer: null });
  };

  // Handle modal cancel
  const handleStopNameCancel = () => {
    if (stopModal.mode === 'create' && stopModal.pendingLayer) {
      stopModal.pendingLayer.remove();
    }
    setStopModal({ isOpen: false, defaultName: '', mode: 'create', stopId: null, pendingLayer: null });
  };

  const attachMarkerHandlers = (marker, stopId) => {
    marker.on('pm:dragend', () => {
      const { lat, lng } = marker.getLatLng();
      setStops((prev) =>
        reindexStops(
          prev.map((stop) => (stop.id === stopId ? { ...stop, lat: Number(lat.toFixed(6)), lng: Number(lng.toFixed(6)) } : stop))
        )
      );
    });

    marker.on('pm:remove', () => removeStop(stopId));

    marker.on('click', () => {
      setStops((prev) => {
        const current = prev.find((stop) => stop.id === stopId);
        setStopModal({
          isOpen: true,
          defaultName: current?.name || '',
          mode: 'edit',
          stopId: stopId,
          pendingLayer: null
        });
        return prev;
      });
    });
  };

  const removeStop = (stopId) => {
    const marker = stopMarkers.current.get(stopId);
    if (marker) {
      mapInstance.current?.removeLayer(marker);
      stopMarkers.current.delete(stopId);
    }
    setStops((prev) => reindexStops(prev.filter((stop) => stop.id !== stopId)));
  };

  const updateStopName = (stopId, name) => {
    setNameEdits((prev) => ({ ...prev, [stopId]: name }));
    setStops((prev) => prev.map((stop) => (stop.id === stopId ? { ...stop, name } : stop)));
    const marker = stopMarkers.current.get(stopId);
    if (marker) {
      marker.bindPopup(`<strong>${name}</strong>`);
    }
  };

  const addMarkerLayer = (stop) => {
    const marker = L.marker([stop.lat, stop.lng], { draggable: true, icon: stopIcon });
    marker.bindPopup(`<strong>${stop.name}</strong>`);
    marker.addTo(mapInstance.current);
    stopMarkers.current.set(stop.id, marker);
    attachMarkerHandlers(marker, stop.id);
  };

  // Programmatically add a stop from search result
  const addStopAtCoordinates = (lat, lng, name) => {
    if (!mapInstance.current) return;
    const formattedLat = Number(Number(lat).toFixed(6));
    const formattedLng = Number(Number(lng).toFixed(6));
    const cleanName = name?.trim() || `Stop ${stops.length + 1}`;

    const newStop = {
      id: `stop-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: cleanName,
      lat: formattedLat,
      lng: formattedLng,
      seq: stops.length
    };

    addMarkerLayer(newStop);
    setStops((prev) => reorderStopsAlongLine(routeGeom, [...prev, newStop]));

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    toast.success(`Added stop: "${cleanName}"`);
  };

  // Handle clicking a search result: smoothly fly to the location and place search pin
  const handleSelectSearchResult = (place) => {
    setIsDropdownOpen(false);
    if (!mapInstance.current || place.lat == null || place.lng == null) return;

    if (searchMarkerRef.current) {
      searchMarkerRef.current.remove();
      searchMarkerRef.current = null;
    }

    const lat = Number(place.lat);
    const lng = Number(place.lng);

    mapInstance.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });

    const searchPin = L.divIcon({
      className: 'search-pin-container',
      html: `
        <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:rgba(59,130,246,0.35); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:30px; height:30px; border-radius:50%; background:#2563eb; border:2.5px solid #ffffff; box-shadow:0 4px 14px rgba(0,0,0,0.45); display:flex; align-items:center; justify-content:center; color:#fff;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    const marker = L.marker([lat, lng], { icon: searchPin }).addTo(mapInstance.current);
    searchMarkerRef.current = marker;

    const popupContent = document.createElement('div');
    popupContent.style.minWidth = '220px';
    popupContent.style.padding = '4px';
    popupContent.innerHTML = `
      <div style="margin-bottom:8px;">
        <div style="font-weight:700; font-size:14px; color:#ffffff; margin-bottom:2px;">${place.name}</div>
        <div style="font-size:11px; color:#94a3b8; line-height:1.35;">${place.display_name}</div>
      </div>
      <div style="display:flex; gap:6px; margin-top:8px;">
        <button id="search-popup-add-btn" style="flex:1; background:#2563eb; color:#ffffff; border:none; padding:7px 12px; border-radius:8px; font-weight:600; font-size:12px; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px;">
          ➕ Add as Stop
        </button>
        <button id="search-popup-dismiss-btn" style="background:rgba(255,255,255,0.12); color:#cbd5e1; border:none; padding:7px 10px; border-radius:8px; font-weight:500; font-size:12px; cursor:pointer;">
          Dismiss
        </button>
      </div>
    `;

    marker.bindPopup(popupContent).openPopup();

    setTimeout(() => {
      const addBtn = popupContent.querySelector('#search-popup-add-btn');
      const dismissBtn = popupContent.querySelector('#search-popup-dismiss-btn');
      if (addBtn) {
        addBtn.onclick = () => {
          addStopAtCoordinates(lat, lng, place.name);
        };
      }
      if (dismissBtn) {
        dismissBtn.onclick = () => {
          marker.remove();
          searchMarkerRef.current = null;
        };
      }
    }, 100);
  };

  const handlePolylineUpdate = (layer) => {
    if (polylineLayer.current) {
      mapInstance.current.removeLayer(polylineLayer.current);
    }
    polylineLayer.current = layer;
    if (!polylineLayer.current.pm.enabled()) {
      polylineLayer.current.pm.enable();
    }
    setRouteGeom(lineToGeoJSON(layer));
    setStops((prev) => reorderStopsAlongLine(lineToGeoJSON(layer), prev));
  };

  const handleMarkerCreate = (layer) => {
    layer.setIcon(stopIcon);
    setStopModal({
      isOpen: true,
      defaultName: `Stop ${stops.length + 1}`,
      mode: 'create',
      stopId: null,
      pendingLayer: layer
    });
  };

  const initExistingData = () => {
    if (initialRoute && mapInstance.current) {
      const layer = L.polyline(initialRoute.coordinates.map(([lng, lat]) => [lat, lng]), {
        color: '#6366f1',
        weight: 4
      }).addTo(mapInstance.current);
      layer.pm.enable();
      handlePolylineUpdate(layer);
      mapInstance.current.fitBounds(layer.getBounds(), { padding: [24, 24] });
    }

    if (initialStops.length) {
      const normalizedStops = initialStops.map((stop, index) => ({
        ...stop,
        id: stop.id || stop._id || `stop-${index}-${stop.seq ?? ''}`
      }));
      normalizedStops.forEach(addMarkerLayer);
      setStops(reindexStops(normalizedStops));
    }
  };

  useEffect(() => {
    if (!mapNode.current || mapInstance.current) return;
    mapInstance.current = L.map(mapNode.current).setView(DEFAULT_CENTER, 14);

    L.tileLayer(TILE_LAYER_URL, {
      attribution: TILE_LAYER_ATTRIBUTION
    }).addTo(mapInstance.current);

    mapInstance.current.pm.addControls({
      position: 'topleft',
      drawCircle: false,
      drawCircleMarker: false,
      drawMarker: true,
      drawRectangle: false,
      drawPolygon: false,
      drawPolyline: true,
      editMode: true,
      dragMode: false,
      cutPolygon: false,
      removalMode: true
    });

    mapInstance.current.on('pm:create', (event) => {
      if (event.shape === 'Line') {
        handlePolylineUpdate(event.layer);
      }
      if (event.shape === 'Marker') {
        handleMarkerCreate(event.layer);
      }
    });

    mapInstance.current.on('pm:remove', (event) => {
      const { layer } = event;
      if (layer === polylineLayer.current) {
        polylineLayer.current = null;
        setRouteGeom(null);
      } else if (layer.__stopId) {
        removeStop(layer.__stopId);
      }
    });

    initExistingData();

    return () => {
      if (searchMarkerRef.current) {
        searchMarkerRef.current.remove();
        searchMarkerRef.current = null;
      }
      mapInstance.current?.remove();
      mapInstance.current = null;
      stopMarkers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = () => {
    setError('');
    if (!routeGeom || !routeGeom.coordinates || routeGeom.coordinates.length < 2) {
      setError('Draw a route polyline with at least two points.');
      return;
    }
    if (sortedStops.length < 2) {
      setError('Add at least two stops to save the route.');
      return;
    }
    const payloadStops = sortedStops.map((stop, index) => ({
      name: stop.name?.trim() || `Stop ${index + 1}`,
      lat: stop.lat,
      lng: stop.lng,
      seq: index
    }));
    onSave(routeGeom, payloadStops);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setStops((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newStops = arrayMove(items, oldIndex, newIndex);

        // Redraw Polyline to match new order
        if (polylineLayer.current) {
          polylineLayer.current.remove();
        }
        const latlngs = newStops.map((s) => [s.lat, s.lng]);
        if (latlngs.length > 1) {
          const newPolyline = L.polyline(latlngs, {
            color: '#6366f1',
            weight: 4
          }).addTo(mapInstance.current);
          newPolyline.pm.enable();
          polylineLayer.current = newPolyline;
          setRouteGeom(lineToGeoJSON(newPolyline));
        }

        return reindexStops(newStops, { sort: false });
      });
    }
  };

  const panelContent = (
    <div className="map-editor__panel-content space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center border border-emerald-500/20">
            <GripVertical size={14} className="text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Stops</h3>
            <p className="text-xs text-slate-500">{sortedStops.length} stops added</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSave}
          disabled={sortedStops.length < 2}
        >
          Save Route
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-800/80 px-4 py-2.5 text-sm font-medium text-slate-300 border border-white/10 transition hover:bg-slate-700/80 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            setStops((prev) => {
              const manualReindex = prev.slice().reverse().map((s, i) => ({ ...s, seq: i }));
              if (polylineLayer.current) polylineLayer.current.remove();
              if (manualReindex.length > 1) {
                const latlngs = manualReindex.map((s) => [s.lat, s.lng]);
                const newPolyline = L.polyline(latlngs, { color: '#6366f1', weight: 4 }).addTo(mapInstance.current);
                newPolyline.pm.enable();
                polylineLayer.current = newPolyline;
                setRouteGeom(lineToGeoJSON(newPolyline));
              }
              return manualReindex;
            });
          }}
          disabled={sortedStops.length < 2}
        >
          ↕️ Reverse
        </button>
      </div>

      {/* Help Text */}
      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-2">
        <Search className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <span>Use the search bar on top of the map to quickly search areas (e.g. <em>Narhe, Talegaon</em>) and add stops.</span>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
          {error}
        </div>
      )}

      {/* Stops List */}
      <div className="space-y-2">
        {sortedStops.length === 0 && (
          <div className="py-10 text-center rounded-xl border-2 border-dashed border-white/10 bg-slate-800/30">
            <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
              <GripVertical size={20} className="text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-400">No stops yet</p>
            <p className="text-xs text-slate-500 mt-1">Search an area or click map to add stops</p>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sortedStops}
            strategy={verticalListSortingStrategy}
          >
            {sortedStops.map((stop, index) => (
              <SortableStopRow
                key={stop.id}
                stop={stop}
                index={index}
                updateStopName={updateStopName}
                removeStop={removeStop}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );

  return (
    <div className="map-editor relative h-full w-full rounded-2xl overflow-hidden">
      {/* Floating Area & Stops Search Bar */}
      <div 
        ref={searchContainerRef} 
        className="absolute top-4 left-1/2 -translate-x-1/2 z-[600] w-full max-w-lg px-4 pointer-events-auto"
      >
        <div className="relative">
          <div className="flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl px-3.5 py-2.5 transition-all focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:border-blue-500">
            <Search className="w-4 h-4 text-blue-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsDropdownOpen(false);
                if (e.key === 'Enter' && searchResults.length > 0) {
                  e.preventDefault();
                  handleSelectSearchResult(searchResults[0]);
                }
              }}
              placeholder="Search area, landmark or stop (e.g. Narhe, Katraj, Talegaon)..."
              className="w-full bg-transparent text-sm font-medium text-white placeholder:text-slate-400 focus:outline-none"
              autoComplete="off"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
            )}
            {searchQuery && !isSearching && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-white/10 animate-fade-in z-[1100]">
              <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60 flex items-center justify-between">
                <span>Matching Locations ({searchResults.length})</span>
                <span className="text-slate-500">Click to fly • Press Enter for 1st</span>
              </div>
              {searchResults.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-blue-600/15 cursor-pointer transition group"
                  onClick={() => handleSelectSearchResult(item)}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                      item.source === 'database'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-white truncate">
                          {item.name}
                        </p>
                        {item.source === 'database' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                            Saved Stop
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 truncate">
                        {item.display_name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      addStopAtCoordinates(item.lat, item.lng, item.name);
                      setIsDropdownOpen(false);
                    }}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition"
                    title="Add this location directly as a route stop"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Stop</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {isDropdownOpen && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-4 text-center text-xs text-slate-400 animate-fade-in z-[1100]">
              No locations found for &quot;{searchQuery}&quot;. Try searching another area or city name.
            </div>
          )}
        </div>
      </div>

      <div className="map-editor__canvas h-full w-full" ref={mapNode} aria-label="Route map editor" />
      
      {/* If a panel ref is provided, portal the content there. Otherwise fallback to overlay (or hide) */}
      {panelContainerRef && panelContainerRef.current
        ? createPortal(panelContent, panelContainerRef.current)
        : null}
      
      {/* Stop Name Modal */}
      <StopNameModal
        isOpen={stopModal.isOpen}
        defaultName={stopModal.defaultName}
        onConfirm={handleStopNameConfirm}
        onCancel={handleStopNameCancel}
      />
    </div>
  );
};

export default MapEditor;
