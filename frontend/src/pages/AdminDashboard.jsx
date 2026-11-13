import { useEffect, useState, useMemo } from 'react';
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
  color = 'blue',
  to,
  onClick,
  actionText = 'View details',
  badge
}) => {
  const navigate = useNavigate();

  const colorStyles = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      borderHover: 'hover:border-blue-400',
      shadowHover: 'hover:shadow-blue-500/10',
      accentText: 'text-blue-600'
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      borderHover: 'hover:border-emerald-400',
      shadowHover: 'hover:shadow-emerald-500/10',
      accentText: 'text-emerald-600'
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      borderHover: 'hover:border-amber-400',
      shadowHover: 'hover:shadow-amber-500/10',
      accentText: 'text-amber-600'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      borderHover: 'hover:border-purple-400',
      shadowHover: 'hover:shadow-purple-500/10',
      accentText: 'text-purple-600'
    },
    indigo: {
      bg: 'bg-indigo-50',
      icon: 'text-indigo-600',
      borderHover: 'hover:border-indigo-400',
      shadowHover: 'hover:shadow-indigo-500/10',
      accentText: 'text-indigo-600'
    },
    sky: {
      bg: 'bg-sky-50',
      icon: 'text-sky-600',
      borderHover: 'hover:border-sky-400',
      shadowHover: 'hover:shadow-sky-500/10',
      accentText: 'text-sky-600'
    }
  };

  const style = colorStyles[color] || colorStyles.blue;
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
      className={`group relative bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all duration-200 ${
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
          <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-blue-600 transition-colors">
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                {badge}
              </span>
            )}
            <ArrowUpRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        )}
      </div>

      <div className="space-y-1 my-1">
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight select-none">
          {value !== undefined && value !== null ? value : '—'}
        </p>
        <p className="text-sm font-semibold text-slate-600">
          {label}
        </p>
      </div>

      {isClickable && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
          <span>{actionText}</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      )}
    </div>
  );
};

const TripCard = ({ trip }) => (
  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/70 transition">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
        <Bus className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 truncate">{trip.bus?.name || 'Unknown Bus'}</p>
        <p className="text-sm text-slate-600">
          Driver: {trip.driver?.name || trip.driver?.username || 'Unknown'}
        </p>
        <p className="text-xs text-slate-400 mt-1">{trip.route?.name || 'No route'}</p>
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
  <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition">
    <div className={`p-2 rounded-lg ${event.status === 'ARRIVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
      <MapPin className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-800 truncate">{event.stop?.name || `Stop ${event.stopIndex}`}</p>
      <p className="text-xs text-slate-500">{event.status} · ETA: {event.etaMinutes ?? '—'} min</p>
    </div>
    <p className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleTimeString()}</p>
  </div>
);

const QuickLink = ({ to, icon: Icon, label }) => (
  <Link
    to={to}
    className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition group"
  >
    <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
      <Icon className="w-5 h-5" />
    </div>
    <span className="flex-1 text-slate-800 font-medium">{label}</span>
    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
  </Link>
);

// ===== MAIN COMPONENT =====

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [trips, setTrips] = useState([]);
  const [events, setEvents] = useState([]);
  const [sosAlert, setSosAlert] = useState(null);
  const [visitorCount, setVisitorCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [clearing, setClearing] = useState(false);
  const [liveBuses, setLiveBuses] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const socketHandlers = useMemo(() => ({
    'trip:sos': setSosAlert,
    'stats:live_visitors': (count) => {
      if (count != null) setVisitorCount(Math.max(1, count));
    },
    'admin:joined': () => { }
  }), []);

  const { socket, isConnected } = useSocket(socketHandlers);

  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('admin:join');
      socket.emit('stats:get_visitors');
    }
  }, [socket, isConnected]);

  const fetchData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [statsRes, tripsRes, eventsRes, analyticsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/trips'),
        api.get('/admin/events'),
        api.get('/admin/analytics').catch(() => ({ data: null }))
      ]);
      setStats(statsRes.data);
      if (statsRes.data?.liveVisitors) {
        setVisitorCount(Math.max(1, statsRes.data.liveVisitors));
      }
      setTrips(tripsRes.data);
      setEvents(eventsRes.data);
      if (analyticsRes.data) setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Fetch live bus positions every 5 seconds
  useEffect(() => {
    const fetchLiveBuses = async () => {
      try {
        const res = await api.get('/admin/live-buses');
        setLiveBuses(res.data);
      } catch { }
    };
    fetchLiveBuses();
    const interval = setInterval(fetchLiveBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClearEvents = async () => {
    if (!confirm('Clear all stop events?')) return;
    setClearing(true);
    try {
      await api.delete('/admin/events');
      setEvents([]);
    } catch {
      alert('Failed to clear events');
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

  // Loading
  if (loading) {
    return <TrackMateLoader message="Loading dashboard..." />;
  }

  // Error
  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center max-w-sm shadow-lg">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-900 font-semibold mb-2">Failed to load</p>
          <p className="text-slate-500 text-sm mb-4">{error}</p>
          <button onClick={() => fetchData(false)} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition shadow-md">
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
          <div className="card-elevated p-6 max-w-sm w-full text-center bg-red-950 border-red-500/50">
            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Emergency Alert</h2>
            <p className="text-red-200 mb-2">{sosAlert.message}</p>
            <p className="text-red-300/60 text-xs mb-4">Trip: {sosAlert.tripId}</p>
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
            <h1 className="text-2xl font-extrabold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm font-medium">Overview of your fleet</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData(true)}
              title="Refresh dashboard"
              className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition shadow-sm"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-bold shadow-sm">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
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
            color="blue"
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
            color="purple"
            badge={stats.activeTrips > 0 ? `${stats.activeTrips} live` : undefined}
            onClick={() => scrollToSection('active-trips')}
            actionText="View Active Trips"
          />
          <StatCard
            icon={Clock}
            label="Avg Trip Duration"
            value={analytics ? formatDuration(analytics.averageDurationMinutes) : '—'}
            color="indigo"
            onClick={handleExportCSV}
            actionText="Export CSV History"
          />
          <StatCard
            icon={MapPin}
            label="Today's Events"
            value={analytics?.todayEvents ?? 0}
            color="sky"
            onClick={() => scrollToSection('events-section')}
            actionText="View Stop Events"
          />
        </section>

        {/* Quick Links */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <QuickLink to="/admin/buses" icon={Bus} label="Manage Buses" />
            <QuickLink to="/admin/drivers" icon={UserCheck} label="Manage Drivers" />
            <QuickLink to="/admin/routes" icon={Navigation} label="Manage Routes" />
            <QuickLink to="/admin/stops" icon={Octagon} label="Manage Stops" />
            <QuickLink to="/admin/students" icon={Users} label="Manage Students" />
            <QuickLink to="/admin/assignments" icon={MapPin} label="Assignments" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              onClick={handleExportCSV}
              className="w-full flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/80 transition group"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Download className="w-5 h-5" />
              </div>
              <span className="flex-1 text-left text-slate-800 font-medium">Export Trip History (CSV)</span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition" />
            </button>
          </div>
        </section>

        {/* Live Fleet Map */}
        <section id="fleet-map" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Map className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900">Live Fleet Map</h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {liveBuses.length} {liveBuses.length === 1 ? 'bus' : 'buses'} active
            </span>
          </div>
          <div className="h-80 rounded-xl overflow-hidden border border-slate-100">
            <AdminMap buses={liveBuses} sosTrips={sosAlert ? [sosAlert] : []} />
          </div>
        </section>

        {/* Active Trips & Events */}
        <section className="grid lg:grid-cols-2 gap-6">
          {/* Active Trips */}
          <div id="active-trips" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Active Trips</h2>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                {trips.length} {trips.length === 1 ? 'trip' : 'trips'}
              </span>
            </div>
            <div className="space-y-3">
              {trips.length > 0 ? (
                trips.map(trip => <TripCard key={trip._id} trip={trip} />)
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No active trips right now</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Events */}
          <div id="events-section" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Events</h2>
              {events.length > 0 && (
                <button
                  onClick={handleClearEvents}
                  disabled={clearing}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
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
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No events recorded today</p>
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
