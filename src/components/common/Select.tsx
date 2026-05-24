/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface SelectProps {
  label?: string;
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  className?: string;
}

export default function Select({ label, options, className = '', value, onChange, ...props }: SelectProps) {
  return (
    <div className="flex flex-col select-none" id="select-wrapper">
      {label && (
        <span className="text-[10px] font-mono tracking-wider text-slate-400 capitalize mb-1 inline-block">
          {label}
        </span>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-300 outline-none focus:border-cyan-500 cursor-pointer appearance-none ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-200">
              {opt.label}
            </option>
          ))}
        </select>
        {/* Draw custom arrow icon */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">
          ▼
        </div>
      </div>
    </div>
  );
}
