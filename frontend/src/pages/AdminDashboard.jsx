import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { API_BASE_URL } from '../constants/api';
import { useSocket } from '../hooks/useSocket';
import {
  Bus, Users, UserCheck, Navigation, Clock, MapPin,
  AlertTriangle, RefreshCw, Trash2, ChevronRight, Activity, Octagon, Map, Download, ArrowUpRight
} from 'lucide-react';
import AdminMap from '../components/AdminMap';
import TrackMateLoader from '../components/TrackMateLoader';
import { apiCache, CACHE_TTL } from '../utils/apiCache';
import { DashboardSkeleton } from '../components/Skeletons';

// ===== HELPER FUNCTIONS =====

const formatDuration = (minutes) => {
  if (minutes == null || isNaN(minutes) || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// ===== COMPONENTS =====

const StatCard = ({
  icon: Icon,
  label,
  value,
  color = 'burgundy',
  to,
  onClick,
  actionText = 'View details',
  badge
}) => {
  const navigate = useNavigate();

  const colorStyles = {
    burgundy: {
      bg: 'bg-[#690907]/10',
      icon: 'text-[#690907]',
      borderHover: 'hover:border-[#690907]/50',
      shadowHover: 'hover:shadow-[#690907]/15',
      accentText: 'text-[#690907]'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-700',
      borderHover: 'hover:border-emerald-300',
      shadowHover: 'hover:shadow-emerald-600/10',
      accentText: 'text-emerald-700'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-700',
      borderHover: 'hover:border-amber-300',
      shadowHover: 'hover:shadow-amber-600/10',
      accentText: 'text-amber-700'
    },
    sage: {
      bg: 'bg-[#A5A79B]/20',
      icon: 'text-[#55564E]',
      borderHover: 'hover:border-[#A5A79B]',
      shadowHover: 'hover:shadow-[#A5A79B]/20',
      accentText: 'text-[#55564E]'
    },
    cream: {
      bg: 'bg-[#E8D2B5]/40',
      icon: 'text-[#8A6743]',
      borderHover: 'hover:border-[#E8D2B5]',
      shadowHover: 'hover:shadow-[#E8D2B5]/30',
      accentText: 'text-[#8A6743]'
    },
    charcoal: {
      bg: 'bg-[#292522]/10',
      icon: 'text-[#292522]',
      borderHover: 'hover:border-[#292522]/40',
      shadowHover: 'hover:shadow-[#292522]/15',
      accentText: 'text-[#292522]'
    }
  };

  const style = colorStyles[color] || colorStyles.burgundy;
  const isClickable = Boolean(to || onClick);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (to) {
      navigate(to);
    }
  };

  return (
    <div
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleClick(e);
        }
      }}
      className={`group relative bg-white/85 backdrop-blur-md border border-[#A5A79B]/30 rounded-2xl p-5 shadow-sm transition-all duration-200 ${
        isClickable
          ? `cursor-pointer hover:-translate-y-1 hover:shadow-lg ${style.borderHover} ${style.shadowHover}`
          : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-xl ${style.bg} ${style.icon} transition-transform duration-200 group-hover:scale-105`}>
          <Icon className="w-6 h-6" />
        </div>
        {isClickable && (
          <div className="flex items-center gap-1.5 text-[#8C827A] group-hover:text-[#690907] transition-colors">
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#690907]/10 text-[#690907]">
                {badge}
              </span>
            )}
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        )}
      </div>

      <div className="space-y-1 my-1">
        <p className="text-3xl font-extrabold text-[#292522] tracking-tight select-none">
          {value !== undefined && value !== null ? value : '—'}
        </p>
        <p className="text-sm font-semibold text-[#5A534C]">
          {label}
        </p>
      </div>

      {isClickable && (
        <div className="mt-4 pt-3 border-t border-[#A5A79B]/20 flex items-center justify-between text-xs font-semibold text-[#8C827A] group-hover:text-[#690907] transition-colors">
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
    </div>
  );
};

const TripCard = ({ trip }) => (
  <div className="p-4 bg-[#F5F0E8]/70 border border-[#A5A79B]/25 rounded-xl hover:bg-white/80 transition">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
        <Bus className="w-6 h-6 text-emerald-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#292522] truncate">{trip.bus?.name || 'Unknown Bus'}</p>
        <p className="text-sm text-[#5A534C]">
          Driver: {trip.driver?.name || trip.driver?.username || 'Unknown'}
        </p>
        <p className="text-xs text-[#8C827A] mt-1">{trip.route?.name || 'No route'}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </span>
      </div>
    </div>
  </div>
);

const EventItem = ({ event }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/70 border border-[#A5A79B]/20 hover:bg-white transition">
    <div className={`p-2 rounded-lg ${event.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-[#690907]/10 text-[#690907]'}`}>
      <MapPin className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-[#292522] truncate">{event.stop?.name || `Stop ${event.stopIndex}`}</p>
      <p className="text-xs text-[#5A534C]">{event.status} · ETA: {event.etaMinutes ?? '—'} min</p>
    </div>
    <p className="text-xs text-[#8C827A]">{new Date(event.timestamp).toLocaleTimeString()}</p>
  </div>
);

const QuickLink = ({ to, icon: Icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-4 bg-[#F5F0E8]/70 border border-[#A5A79B]/25 rounded-xl hover:bg-white/90 hover:border-[#690907]/30 transition group"
  >
    <div className="p-2 rounded-lg bg-[#690907]/10 text-[#690907] group-hover:bg-[#690907] group-hover:text-white transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <span className="flex-1 text-[#292522] font-semibold">{label}</span>
    <ChevronRight className="w-5 h-5 text-[#8C827A] group-hover:text-[#690907] group-hover:translate-x-0.5 transition" />
  </Link>
);

// ===== MAIN COMPONENT =====

const AdminDashboard = () => {
  const cachedStats = apiCache.peek('/admin/dashboard');
  const cachedTrips = apiCache.peek('/admin/trips');
  const cachedEvents = apiCache.peek('/admin/events');
  const cachedBuses = apiCache.peek('/admin/live-buses');
  const cachedAnalytics = apiCache.peek('/admin/analytics');

  const [stats, setStats] = useState(cachedStats || {});
  const [trips, setTrips] = useState(cachedTrips || []);
  const [events, setEvents] = useState(cachedEvents || []);
  const [sosAlert, setSosAlert] = useState(null);
  const [visitorCount, setVisitorCount] = useState(cachedStats?.liveVisitors || 1);
  const [hasLoaded, setHasLoaded] = useState(Boolean(cachedStats));
  const hasLoadedRef = useRef(Boolean(cachedStats));
  const [isInitialLoading, setIsInitialLoading] = useState(!cachedStats);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const [clearing, setClearing] = useState(false);
  const [liveBuses, setLiveBuses] = useState(cachedBuses || []);
  const [analytics, setAnalytics] = useState(cachedAnalytics || null);

  const socketHandlers = useMemo(() => ({
    'trip:sos': (alert) => {
      setSosAlert(alert);
      if (alert?.tripId) {
        setTrips(prev => prev.map(t => (t._id === alert.tripId ? { ...t, sos: true } : t)));
      }
    },
    'stats:live_visitors': (count) => {
      if (count != null) setVisitorCount(Math.max(1, count));
    },
    'trip:location_update': (payload) => {
      if (!payload?.tripId) return;
      // Incrementally update matching bus location without full refetch
      setLiveBuses(prev => prev.map(b => {
        if (b.tripId === payload.tripId || b._id === payload.busId) {
          return {
            ...b,
            lastPosition: { lat: payload.lat, lng: payload.lng },
            speed: payload.speed ?? b.speed,
            updatedAt: payload.timestamp || Date.now()
          };
        }
        return b;
      }));
    },
    'bus:trip_started': () => {
      apiCache.invalidate('/admin');
      fetchDataRef.current?.(true);
    },
    'bus:trip_ended': () => {
      apiCache.invalidate('/admin');
      fetchDataRef.current?.(true);
    },
    'admin:joined': () => { }
  }), []);

  const { socket, isConnected } = useSocket(socketHandlers);

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('admin:join');
    }
  }, [socket, isConnected]);

  const fetchData = async (isManualRefresh = false) => {
    try {
      if (!hasLoadedRef.current) {
        setIsInitialLoading(true);
      } else {
        setRefreshing(true);
      }
      setSyncError(null);

      const [statsData, tripsData, eventsData, liveBusesData, analyticsData] = await Promise.all([
        apiCache.fetchWithCache('/admin/dashboard', { ttl: CACHE_TTL.DASHBOARD, forceFresh: isManualRefresh }),
        apiCache.fetchWithCache('/admin/trips', { ttl: CACHE_TTL.DASHBOARD, forceFresh: isManualRefresh }).catch(() => []),
        apiCache.fetchWithCache('/admin/events', { ttl: CACHE_TTL.DASHBOARD, forceFresh: isManualRefresh }).catch(() => []),
        apiCache.fetchWithCache('/admin/live-buses', { ttl: 15000, forceFresh: isManualRefresh }).catch(() => []),
        apiCache.fetchWithCache('/admin/analytics', { ttl: CACHE_TTL.STANDARD, forceFresh: isManualRefresh }).catch(() => null)
      ]);

      setStats(statsData || {});
      if (statsData?.liveVisitors) {
        setVisitorCount(Math.max(1, statsData.liveVisitors));
      }
      setTrips(tripsData || []);
      setEvents(eventsData || []);
      setLiveBuses(liveBusesData || []);
      setAnalytics(analyticsData || null);

      hasLoadedRef.current = true;
      setHasLoaded(true);
      setError(null);
      setLastRefreshed(Date.now());
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to load dashboard data';
      if (!hasLoadedRef.current) {
        setError(errMsg);
      } else {
        // Keep existing data visible! Never unmount on background refresh error!
        setSyncError('Sync paused — displaying cached data');
      }
    } finally {
      setIsInitialLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDataRef = useRef(fetchData);
  useEffect(() => { fetchDataRef.current = fetchData; }, [fetchData]);

  useEffect(() => {
    fetchData(true);

    const POLL_INTERVAL = 15000;
    let interval = null;

    const startPolling = () => {
      if (!interval) {
        interval = setInterval(() => {
          fetchDataRef.current?.(false);
        }, POLL_INTERVAL);
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDataRef.current?.(false);
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleClearEvents = async () => {
    if (!window.confirm('Are you sure you want to clear all stop events? This cannot be undone.')) {
      return;
    }
    setClearing(true);
    try {
      await api.delete('/admin/events');
      setEvents([]);
      apiCache.invalidate('/admin/events');
    } catch (err) {
      console.error('Failed to clear events:', err);
      alert(err.response?.data?.message || 'Failed to clear events');
    } finally {
      setClearing(false);
    }
  };

  const handleExportCSV = () => {
    const token = localStorage.getItem('tm_token');
    window.open(`${API_BASE_URL}/api/admin/export-trips?days=30&token=${token}`, '_blank');
  };

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Initial loading only when no cached data is available yet
  if (isInitialLoading && !hasLoaded) {
    return <DashboardSkeleton />;
  }

  // Error only on initial load when no data exists
  if (error && !hasLoaded) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md border border-[#A5A79B]/30 rounded-2xl p-6 text-center max-w-sm shadow-lg">
          <AlertTriangle className="w-12 h-12 text-[#690907] mx-auto mb-4" />
          <p className="text-[#292522] font-semibold mb-2">Failed to load</p>
          <p className="text-[#8C827A] text-sm mb-4">{error}</p>
          <button onClick={() => fetchData(true)} className="px-6 py-2.5 bg-[#690907] hover:bg-[#82110f] text-white rounded-xl font-medium transition shadow-md shadow-[#690907]/20">
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-12">
      {/* SOS Alert */}
      {sosAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="card-elevated p-6 max-w-sm w-full text-center bg-[#330302] border border-[#690907]">
            <div className="w-16 h-16 rounded-full bg-[#690907]/30 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-[#CB6F6D]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Emergency Alert</h2>
            <p className="text-[#ECC5C5] mb-2">{sosAlert.message}</p>
            <p className="text-[#DE9E9E]/60 text-xs mb-4">Trip: {sosAlert.tripId}</p>
            <button onClick={() => setSosAlert(null)} className="w-full py-3 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition">
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-[#292522]">Admin Dashboard</h1>
            <p className="text-[#5A534C] text-sm font-medium">Overview of your campus fleet</p>
          </div>
          <div className="flex items-center gap-3">
            {syncError && (
              <span className="text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl font-medium" title={syncError}>
                ⚠️ Cached
              </span>
            )}
            {lastRefreshed && !syncError && (
              <span className="text-xs text-[#8C827A] hidden sm:inline" title="Background auto-sync active">
                Synced {new Date(lastRefreshed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchData(true)}
              title="Refresh dashboard"
              className="p-2.5 rounded-xl bg-white/85 border border-[#A5A79B]/30 text-[#292522] hover:text-[#690907] hover:border-[#690907]/40 transition shadow-sm active:scale-95"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-[#690907]' : ''}`} />
            </button>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8D2B5]/30 text-[#690907] border border-[#E8D2B5] text-sm font-bold shadow-sm">
              <Activity className="w-4 h-4 text-[#690907] animate-pulse" />
              <span>{visitorCount} Online</span>
            </div>
          </div>
        </header>

        {/* Stats Palette Grid */}
        <section aria-label="Fleet Overview Palette" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Bus}
            label="Total Buses"
            value={stats.busCount}
            color="burgundy"
            to="/admin/buses"
            actionText="Manage Buses"
          />
          <StatCard
            icon={UserCheck}
            label="Drivers"
            value={stats.driverCount}
            color="emerald"
            to="/admin/drivers"
            actionText="Manage Drivers"
          />
          <StatCard
            icon={Users}
            label="Students"
            value={stats.studentCount}
            color="amber"
            to="/admin/students"
            actionText="Manage Students"
          />
          <StatCard
            icon={Navigation}
            label="Active Trips"
            value={stats.activeTrips ?? 0}
            color="sage"
            badge={stats.activeTrips > 0 ? `${stats.activeTrips} live` : undefined}
            onClick={() => scrollToSection('active-trips')}
            actionText="View Active Trips"
          />
          <StatCard
            icon={Clock}
            label="Avg Trip Duration"
            value={analytics ? formatDuration(analytics.averageDurationMinutes) : '—'}
            color="cream"
            onClick={handleExportCSV}
            actionText="Export CSV History"
          />
          <StatCard
            icon={MapPin}
            label="Today's Events"
            value={analytics?.todayEvents ?? 0}
            color="charcoal"
            onClick={() => scrollToSection('events-section')}
            actionText="View Stop Events"
          />
        </section>

        {/* Quick Links */}
        <section className="bg-white/85 backdrop-blur-md border border-[#A5A79B]/30 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-[#292522] mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink to="/admin/buses" icon={Bus} label="Manage Buses" />
            <QuickLink to="/admin/drivers" icon={UserCheck} label="Manage Drivers" />
            <QuickLink to="/admin/routes" icon={Navigation} label="Manage Routes" />
            <QuickLink to="/admin/stops" icon={Octagon} label="Manage Stops" />
            <QuickLink to="/admin/students" icon={Users} label="Manage Students" />
            <QuickLink to="/admin/assignments" icon={MapPin} label="Assignments" />
          </div>
          <div className="mt-4 pt-4 border-t border-[#A5A79B]/20">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 p-4 bg-[#F5F0E8]/70 border border-[#A5A79B]/25 rounded-xl hover:bg-white/90 transition group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                <Download className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left text-[#292522] font-semibold">Export Trip History (CSV)</span>
              <ChevronRight className="w-5 h-5 text-[#8C827A] group-hover:text-[#690907] group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </section>

        {/* Live Fleet Map */}
        <section id="fleet-map" className="bg-white/85 backdrop-blur-md border border-[#A5A79B]/30 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-[#690907]" />
              <h2 className="text-lg font-bold text-[#292522]">Live Fleet Map</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8D2B5]/30 text-[#690907] border border-[#E8D2B5]">
              {liveBuses.length} {liveBuses.length === 1 ? 'bus' : 'buses'} active
            </span>
          </div>
          <div className="h-80 rounded-xl overflow-hidden border border-[#A5A79B]/25">
            <AdminMap buses={liveBuses} sosTrips={sosAlert ? [sosAlert] : []} />
          </div>
        </section>

        {/* Active Trips & Events */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* Active Trips */}
          <div id="active-trips" className="bg-white/85 backdrop-blur-md border border-[#A5A79B]/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#292522]">Active Trips</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#A5A79B]/15 text-[#55564E]">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
              </span>
            </div>
            <div className="space-y-3">
              {trips.length > 0 ? (
                trips.map(trip => <TripCard key={trip._id} trip={trip} />)
              ) : (
                <div className="text-center py-10 bg-[#F5F0E8]/60 rounded-xl border border-dashed border-[#A5A79B]/30">
                  <Navigation className="w-8 h-8 text-[#A5A79B] mx-auto mb-2" />
                  <p className="text-[#8C827A] text-sm font-medium">No active trips right now</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div id="events-section" className="bg-white/85 backdrop-blur-md border border-[#A5A79B]/30 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#292522]">Recent Events</h2>
              {events.length > 0 && (
                <button
                  onClick={handleClearEvents}
                  disabled={clearing}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-[#690907] hover:bg-[#690907]/10 rounded-lg transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {clearing ? 'Clearing...' : 'Clear'}
                </button>
              )}
            </div>
            <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
              {events.length > 0 ? (
                events.slice(0, 10).map(event => <EventItem key={event._id} event={event} />)
              ) : (
                <div className="text-center py-10 bg-[#F5F0E8]/60 rounded-xl border border-dashed border-[#A5A79B]/30">
                  <MapPin className="w-8 h-8 text-[#A5A79B] mx-auto mb-2" />
                  <p className="text-[#8C827A] text-sm font-medium">No events recorded today</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default AdminDashboard;
