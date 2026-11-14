import { Bus, Navigation, User, Users, ChevronRight } from 'lucide-react';

const BusCard = ({ bus, onAction, actionLabel = 'Manage' }) => {
  if (!bus) return null;
  const hasRoute = Boolean(bus.route);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#A5A79B]/30 bg-white/85 p-5 shadow-sm backdrop-blur-md transition-all duration-300 hover:border-[#690907]/40 hover:shadow-xl hover:shadow-[#690907]/10">
      {/* Top accent glow */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#690907] via-[#A5A79B] to-[#E8D2B5] opacity-75 group-hover:opacity-100 transition-opacity" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
            hasRoute
              ? 'bg-[#690907]/10 text-[#690907] group-hover:bg-[#690907] group-hover:text-[#F5F0E8]'
              : 'bg-[#A5A79B]/15 text-[#8C827A]'
          }`}>
            <Bus className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-[#292522] truncate group-hover:text-[#690907] transition-colors">
              {bus.name}
            </h3>
            <p className="text-xs font-mono text-[#8C827A]">#{bus.numberPlate}</p>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
          hasRoute
            ? 'bg-[#690907]/10 text-[#690907] border border-[#690907]/25 font-semibold'
            : 'bg-[#A5A79B]/15 text-[#8C827A] border border-[#A5A79B]/20'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${hasRoute ? 'bg-[#690907] animate-pulse' : 'bg-[#A5A79B]'}`} />
          {hasRoute ? 'Active' : 'Unassigned'}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs">
        <div className="rounded-xl bg-[#F5F0E8]/70 border border-[#A5A79B]/20 p-2.5">
          <div className="flex items-center gap-1 text-[#5A534C] mb-1">
            <Navigation className="w-3.5 h-3.5 text-[#690907]" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Route</span>
          </div>
          <p className="font-medium text-[#292522] truncate">
            {bus.route?.name || 'No route assigned'}
          </p>
        </div>

        <div className="rounded-xl bg-[#F5F0E8]/70 border border-[#A5A79B]/20 p-2.5">
          <div className="flex items-center gap-1 text-[#5A534C] mb-1">
            <User className="w-3.5 h-3.5 text-[#690907]" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Driver</span>
          </div>
          <p className="font-medium text-[#292522] truncate">
            {bus.driver?.name || bus.driver?.username || 'Unassigned'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-[#A5A79B]/20">
        <div className="flex items-center gap-1.5 text-xs text-[#8C827A]">
          <Users className="w-3.5 h-3.5" />
          <span>{bus.capacity || 40} seats</span>
        </div>

        {onAction && (
          <button
            type="button"
            onClick={() => onAction(bus)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#690907] px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-[#690907]/20 transition hover:bg-[#82110f] hover:shadow-[#690907]/35 active:scale-95"
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
