/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import LED from './LED';

interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: 'cyan' | 'purple' | 'emerald';
}

export default function Toggle({ label, checked, onChange, color = 'cyan' }: ToggleProps) {
  const bgColors = {
    cyan: 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]',
    purple: 'bg-fuchsia-500 shadow-[0_0_8px_rgba(217,70,239,0.4)]',
    emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
  };

  return (
    <label className="flex items-center justify-between cursor-pointer select-none py-1.5 px-2 bg-slate-900 border border-slate-850 rounded-lg hover:border-slate-700 transition" id="toggle-container">
      <span className="text-[11px] font-mono tracking-wide text-slate-400 capitalize">{label}</span>
      
      <div className="flex items-center gap-2">
        {/* Visual LED */}
        <LED active={checked} color={color === 'cyan' ? 'cyan' : color === 'purple' ? 'purple' : 'emerald'} size="xs" />

        {/* Custom switch frame */}
        <div
          onClick={() => onChange(!checked)}
          className={`w-8 h-4 rounded-full p-0.5 transition-colors duration-150 ease-in-out ${
            checked ? bgColors[color] : 'bg-slate-800'
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full bg-white shadow-md transform duration-150 ease-in-out ${
              checked ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </label>
  );
}
