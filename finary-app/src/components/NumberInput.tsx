import { useEffect, useState } from 'react';
import { parseNum } from '../lib/format';

/**
 * Champ numérique tolérant à la virgule (FR) comme au point (EN).
 * Utilise un tampon texte local pour permettre de taper « 16, » puis « 16,98 »
 * sans que la valeur ne « saute ». Renvoie le nombre analysé via onChange.
 */
export function NumberInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value ? String(value) : '');

  // Resynchronise si la valeur externe change (ex: cours rafraîchi en direct)
  useEffect(() => {
    if (parseNum(text) !== value) setText(value ? String(value) : text === '' ? '' : '0');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = parseNum(t);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}
