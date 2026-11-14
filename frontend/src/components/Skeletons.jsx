import React from 'react';

/**
 * Premium Luxury Skeletons for Where Is My Bus
 * Palette: #F5F0E8 (ivory), #E8D2B5 (cream), #A5A79B (sage), #690907 (burgundy accent)
 * Strictly zero blue/violet shades.
 */

export const Shimmer = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-lg bg-[#EFE5D8]/80 ${className}`}
    style={{
      backgroundImage: 'linear-gradient(90deg, rgba(239,229,216,0.6) 0%, rgba(232,210,181,0.5) 50%, rgba(239,229,216,0.6) 100%)',
      backgroundSize: '200% 100%'
    }}
  />
);

export const StatCardSkeleton = () => (
  <div className="card p-4 border border-[#A5A79B]/20 bg-white/70 backdrop-blur-sm shadow-sm">
    <div className="flex items-start gap-3">
      <Shimmer className="w-10 h-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-6 w-12" />
        <Shimmer className="h-2.5 w-24" />
      </div>
    </div>
  </div>
);

export const CardSkeleton = () => (
  <div className="card p-4 border border-[#A5A79B]/20 bg-white/70 backdrop-blur-sm shadow-sm space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Shimmer className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="h-3 w-16" />
        </div>
      </div>
      <Shimmer className="h-5 w-14 rounded-full" />
    </div>
    <div className="grid grid-cols-2 gap-2 pt-2">
      <Shimmer className="h-10 rounded-lg" />
      <Shimmer className="h-10 rounded-lg" />
    </div>
    <div className="flex justify-end gap-2 pt-2 border-t border-[#A5A79B]/10">
      <Shimmer className="h-7 w-16 rounded-lg" />
      <Shimmer className="h-7 w-16 rounded-lg" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ cols = 4 }) => (
  <div className="card p-4 border border-[#A5A79B]/20 bg-white/70 backdrop-blur-sm flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <Shimmer className="w-9 h-9 rounded-full flex-shrink-0" />
      <div className="space-y-1.5 flex-1 max-w-xs">
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-3 w-20" />
      </div>
    </div>
    {cols > 2 && <Shimmer className="h-4 w-28 hidden sm:block" />}
    {cols > 3 && <Shimmer className="h-4 w-24 hidden md:block" />}
    <div className="flex items-center gap-2">
      <Shimmer className="h-8 w-8 rounded-lg" />
      <Shimmer className="h-8 w-8 rounded-lg" />
    </div>
  </div>
);

export const SkeletonGrid = ({ count = 6, type = 'card' }) => (
  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }, (_, i) => (
      type === 'card' ? <CardSkeleton key={i} /> : <TableRowSkeleton key={i} />
    ))}
  </div>
);

export const DashboardSkeleton = () => (
  <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-2">
        <Shimmer className="h-7 w-48" />
        <Shimmer className="h-4 w-32" />
      </div>
      <div className="flex items-center gap-3">
        <Shimmer className="h-9 w-24 rounded-full" />
      </div>
    </div>

    {/* 4 Stat Cards */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }, (_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>

    {/* Fleet map placeholder */}
    <div className="card p-5 border border-[#A5A79B]/20 bg-white/70 space-y-4">
      <div className="flex justify-between items-center">
        <Shimmer className="h-5 w-36" />
        <Shimmer className="h-4 w-20" />
      </div>
      <Shimmer className="h-72 w-full rounded-xl" />
    </div>
  </div>
);

