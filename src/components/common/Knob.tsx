/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';

interface KnobProps {
  id?: string;
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  color?: 'cyan' | 'purple' | 'emerald' | 'amber';
}

export default function Knob({ min, max, value, onChange, label, unit = '', color = 'cyan' }: KnobProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startVal = useRef(0);
  const valueRange = max - min;

  const colorStyles = {
    cyan: 'stroke-cyan-400 drop-shadow-[0_0_3px_rgba(34,211,238,0.5)]',
    purple: 'stroke-fuchsia-500 drop-shadow-[0_0_3px_rgba(217,70,239,0.5)]',
    emerald: 'stroke-emerald-400 drop-shadow-[0_0_3px_rgba(52,211,153,0.5)]',
    amber: 'stroke-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]',
  };

  const ringBgColors = {
    cyan: 'stroke-slate-850',
    purple: 'stroke-slate-850',
    emerald: 'stroke-slate-850',
    amber: 'stroke-slate-850',
  };

  // Percent representing the range filled: 0 to 1
  const percent = Math.min(1, Math.max(0, (value - min) / valueRange));

  // Range of angles from 225 deg (min) to -45 deg (max), i.e. 270 deg of total rot region
  const minAngle = -135;
  const maxAngle = 135;
  const targetAngle = minAngle + percent * (maxAngle - minAngle);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    document.body.style.cursor = 'ns-resize';
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startVal.current = value;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY.current - e.clientY; // upwards drag counts as increase!
      // Sensitivity: drag 150px to cover total min-to-max range
      const stepVal = (deltaY / 150) * valueRange;
      let nextVal = startVal.current + stepVal;
      nextVal = Math.min(max, Math.max(min, nextVal));
      onChange(Number(nextVal.toFixed(3)));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = startY.current - e.touches[0].clientY;
      const stepVal = (deltaY / 150) * valueRange;
      let nextVal = startVal.current + stepVal;
      nextVal = Math.min(max, Math.max(min, nextVal));
      onChange(Number(nextVal.toFixed(3)));
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        document.body.style.cursor = 'default';
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, valueRange, min, max, onChange]);

  // SVG parameters for custom ring indicator
  const size = 52;
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  // Arc length represents 270 deg rot limit: 270 / 360 = 0.75
  const strokeDashoffset = circumference - percent * circumference * 0.75;

  return (
    <div className="flex flex-col items-center select-none" id="knob-container">
      {label && (
        <span className="text-[10px] font-mono tracking-wider text-slate-400 capitalize mb-1 inline-block">
          {label}
        </span>
      )}

      {/* Main Knob Ring */}
      <div
        className="relative cursor-ns-resize"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} className="transform -rotate-[135deg]">
          {/* Background track circle arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-slate-800"
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * 0.25} // cover only 270 degrees
            strokeLinecap="round"
          />

          {/* Active fill indicator */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={`${colorStyles[color]}`}
            strokeWidth="4"
            strokeDasharray={circumference * 0.75}
            strokeDashoffset={circumference * 0.75 * (1 - percent)}
            strokeLinecap="round"
          />
        </svg>

        {/* Center rotating pointer dial cap */}
        <div
          className="absolute inset-[8px] rounded-full bg-slate-900 border border-slate-700 shadow-xl flex items-center justify-center transition-all duration-150"
          style={{ transform: `rotate(${targetAngle}deg)` }}
        >
          {/* Needle indicator dot */}
          <div className={`w-1 h-3 rounded-b-md mb-2 bg-slate-400`} />
        </div>
      </div>

      {/* Numerical display indicators */}
      <span className="text-[10px] font-mono tracking-tight text-slate-400 mt-1">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(1)}
        <span className="text-slate-500 ml-0.5">{unit}</span>
      </span>
    </div>
  );
}
