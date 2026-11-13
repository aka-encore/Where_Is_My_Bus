import { Bus, Navigation, User, Users, ChevronRight } from 'lucide-react';

const BusCard = ({ bus, onAction, actionLabel = 'Manage' }) => {
  if (!bus) return null;
  const hasRoute = Boolean(bus.route);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/10">
      {/* Top accent glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            hasRoute
              ? 'bg-blue-500/15 text-blue-400 group-hover:bg-blue-500/25 group-hover:text-blue-300'
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Bus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-white truncate group-hover:text-blue-200 transition-colors">
              {bus.name}
            </h3>
            <p className="text-xs font-mono text-slate-400">#{bus.numberPlate}</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
          hasRoute
            ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
            : 'bg-slate-800 text-slate-400 border border-white/5'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${hasRoute ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
          {hasRoute ? 'Active' : 'Unassigned'}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
        <div className="rounded-xl bg-slate-950/50 border border-white/5 p-2.5">
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            <Navigation className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium uppercase tracking-wider text-[10px]">Route</span>
          </div>
          <p className="font-medium text-slate-200 truncate">
            {bus.route?.name || 'No route assigned'}
          </p>
        </div>

        <div className="rounded-xl bg-slate-950/50 border border-white/5 p-2.5">
          <div className="flex items-center gap-1 text-slate-400 mb-1">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium uppercase tracking-wider text-[10px]">Driver</span>
          </div>
          <p className="font-medium text-slate-200 truncate">
            {bus.driver?.name || bus.driver?.username || 'Unassigned'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Users className="w-3.5 h-3.5" />
          <span>{bus.capacity || 40} seats</span>
        </div>

        {onAction && (
          <button
            type="button"
            onClick={() => onAction(bus)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-blue-500 hover:shadow-blue-500/40 active:scale-95"
          >
            <span>{actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BusCard;
