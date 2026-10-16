"use client";

import React, { useEffect, useState } from "react";
import { SearchInput as BaseSearchInput } from "@/components/ui/SearchInput";

export function SearchInput({
  value: controlledValue,
  onChange,
  onSearch,
  onClear,
  debounceMs = 0,
  placeholder = "Search records...",
  loading = false,
  className,
  wrapperClassName,
  ...props
}) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = useState(controlledValue || "");

  useEffect(() => {
    if (isControlled) {
      setInternalValue(controlledValue || "");
    }
  }, [controlledValue, isControlled]);

  useEffect(() => {
    if (debounceMs <= 0 || !onSearch) return;

    const timer = setTimeout(() => {
      onSearch(internalValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalValue, debounceMs, onSearch]);

  const handleChange = (e) => {
    const val = e.target.value;
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(e);
    if (debounceMs <= 0 && onSearch) {
      onSearch(val);
    }
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }
    onClear?.();
    if (onSearch) {
      onSearch("");
    }
    onChange?.({ target: { value: "" } });
  };

  return (
    <BaseSearchInput
      value={isControlled ? controlledValue : internalValue}
      onChange={handleChange}
      onClear={handleClear}
      placeholder={placeholder}
      loading={loading}
      className={className}
      wrapperClassName={wrapperClassName}
      {...props}
    />
  );
}
