/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LEDProps {
  active: boolean;
  color?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function LED({ active, color = 'cyan', size = 'sm' }: LEDProps) {
  const sizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2.5 h-2.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  const activeShadows = {
    cyan: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] ring-1 ring-cyan-300',
    purple: 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.85)] ring-1 ring-fuchsia-300',
    emerald: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.85)] ring-1 ring-emerald-300',
    amber: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)] ring-1 ring-amber-300',
    rose: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.85)] ring-1 ring-rose-300',
  };

  const inactiveClasses = 'bg-slate-800 border border-slate-700 shadow-inner';

  return (
    <div
      className={`rounded-full transition-all duration-150 ${sizeClasses[size]} ${
        active ? activeShadows[color] : inactiveClasses
      }`}
    />
  );
}
