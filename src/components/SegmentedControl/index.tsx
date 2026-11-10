import { useId } from 'react';

import './styles.css';

interface SegmentedControlProps<T extends string> {
  label: string;                                   // accessible name
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  legendText?: string;
}

export function SegmentedControl<T extends string>({
  label, options, value, onChange, legendText
}: SegmentedControlProps<T>) {
  const name = useId();

  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
    {legendText && <legend className="sr-only">{legendText}</legend>}
      {options.map((op) => (
        <label key={op.value} className="segmented-option">
          <input
            type="radio"
            name={name}
            value={op.value}
            checked={value === op.value}
            onChange={() => onChange(op.value)}
          />
          <span>{op.label}</span>
        </label>
      ))}
    </div>
  );
}