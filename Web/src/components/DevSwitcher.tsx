import type { ScreenId } from "../bridge";

const SCREENS: { id: ScreenId; label: string }[] = [
  { id: "loremIpsum", label: "Lorem Ipsum" },
  { id: "dolorSit", label: "Dolor Sit" },
];

/**
 * A tiny screen switcher shown only when running outside the native app
 * (plain-browser dev), where there's no native sidebar to drive navigation.
 */
export function DevSwitcher({
  current,
  onSelect,
}: {
  current: ScreenId;
  onSelect: (id: ScreenId) => void;
}) {
  return (
    <div className="dev-switcher">
      {SCREENS.map((s) => (
        <button
          key={s.id}
          aria-pressed={s.id === current}
          onClick={() => onSelect(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
