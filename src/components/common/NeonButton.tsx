/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface NeonButtonProps {
  active?: boolean;
  color?: 'cyan' | 'purple' | 'emerald' | 'amber' | 'rose' | 'slate';
  glow?: boolean;
  children?: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  title?: string;
}

export default function NeonButton({
  children,
  active = false,
  color = 'cyan',
  glow = true,
  className = '',
  onClick,
  disabled,
  title,
  ...props
}: NeonButtonProps) {
  const activeStyles = {
    cyan: 'bg-cyan-950/40 text-cyan-400 border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.25)]',
    purple: 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-400 shadow-[0_0_10px_rgba(217,70,239,0.25)]',
    emerald: 'bg-emerald-950/40 text-emerald-400 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.25)]',
    amber: 'bg-amber-950/30 text-amber-400 border-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.22)]',
    rose: 'bg-rose-950/40 text-rose-400 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.25)]',
    slate: 'bg-slate-800 text-white border-slate-600',
  };

  const hoverStyles = {
    cyan: 'hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-950/20',
    purple: 'hover:border-fuchsia-500 hover:text-fuchsia-400 hover:bg-fuchsia-950/20',
    emerald: 'hover:border-emerald-400 hover:text-emerald-400 hover:bg-emerald-950/20',
    amber: 'hover:border-amber-400 hover:text-amber-400 hover:bg-amber-950/15',
    rose: 'hover:border-rose-400 hover:text-rose-400 hover:bg-rose-950/20',
    slate: 'hover:border-slate-500 hover:bg-slate-800/50',
  };

  const baseStyles = 'px-3 py-1.5 rounded-lg border text-xs font-mono tracking-wider transition-all duration-150 shadow-md transform active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:pointer-events-none select-none';
  const inactiveStyles = 'bg-slate-900 border-slate-800 text-slate-400';

  return (
    <button
      className={`${baseStyles} ${active ? activeStyles[color] : inactiveStyles} ${hoverStyles[color]} ${className}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}
