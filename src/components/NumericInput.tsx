"use client";

import React, { useState, useEffect } from "react";

interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  min: number;
  max: number;
  step?: number;
  type: "currency" | "percent" | "years" | "number";
  className?: string;
}

export default function NumericInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  type,
  className = ""
}: NumericInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  // Format value for display when blurred
  const formatValue = (val: number) => {
    if (type === "currency") {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 0
      }).format(val);
    }
    if (type === "percent") {
      return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2
      }).format(val);
    }
    if (type === "years") {
      return val.toString();
    }
    return val.toString();
  };

  // Sync temp value when prop changes outside of focus
  useEffect(() => {
    if (!isFocused) {
      setTempValue(formatValue(value));
    }
  }, [value, isFocused, type]);

  const handleFocus = () => {
    setIsFocused(true);
    // When focused, show the raw number without formatting commas
    setTempValue(value.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawStr = e.target.value;
    setTempValue(rawStr);
    
    if (rawStr === "") {
      onChange(0);
      return;
    }
    
    const parsed = Number(rawStr);
    if (!isNaN(parsed)) {
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    let parsed = Number(tempValue);
    if (isNaN(parsed) || tempValue === "") {
      parsed = min;
    }
    // Clamp to min/max range
    const clamped = Math.max(min, Math.min(max, parsed));
    
    // Standardize to step value if defined
    let rounded = clamped;
    if (step) {
      rounded = Math.round(clamped / step) * step;
      // Re-clamp in case rounding pushes it out of bounds
      rounded = Math.max(min, Math.min(max, rounded));
    }

    // Fix floating point issues e.g. 5.090000000000001
    rounded = Number(rounded.toFixed(4));

    onChange(rounded);
    setTempValue(formatValue(rounded));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`flex items-center gap-1 bg-navy-bg/55 border border-border-navy/60 focus-within:border-emerald/50 rounded-lg px-2 py-0.5 text-xs text-emerald font-bold transition-all w-24 md:w-28 shrink-0 ${className}`}>
      {type === "currency" && (
        <span className="text-muted-grey/60 text-[10px] select-none">₹</span>
      )}
      <input
        type={isFocused ? "number" : "text"}
        value={tempValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={step}
        className="w-full bg-transparent text-emerald font-bold text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {type === "percent" && (
        <span className="text-muted-grey/60 text-[10px] ml-0.5 select-none">%</span>
      )}
      {type === "years" && (
        <span className="text-muted-grey/60 text-[10px] ml-0.5 select-none">Yr{value !== 1 ? "s" : ""}</span>
      )}
    </div>
  );
}
