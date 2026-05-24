/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface SliderProps {
  label?: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  color?: 'cyan' | 'purple' | 'emerald';
}

export default function Slider({
  label,
  min,
  max,
  step = 0.01,
  value,
  onChange,
  unit = '',
  color = 'cyan',
}: SliderProps) {
  const accentColors = {
    cyan: 'accent-cyan-400',
    purple: 'accent-fuchsia-500',
    emerald: 'accent-emerald-400',
  };

  const textColors = {
    cyan: 'text-cyan-400',
    purple: 'text-fuchsia-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className="flex flex-col w-full select-none" id="slider-container">
      <div className="flex items-center justify-between mb-1.5">
        {label && (
          <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
            {label}
          </span>
        )}
        <span className={`text-[10px] font-mono font-medium ${textColors[color]}`}>
          {value.toFixed(2)}
          <span className="text-slate-500 ml-0.5">{unit}</span>
        </span>
      </div>

      <div className="relative flex items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer outline-none ${accentColors[color]}`}
        />
      </div>
    </div>
  );
}
