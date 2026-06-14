import { icons } from "../icons";

/** Renders one of the outline icons from `icons` by name. */
export function Icon({ name }: { name: string }) {
  const inner = icons[name] ?? icons["file-text"];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
