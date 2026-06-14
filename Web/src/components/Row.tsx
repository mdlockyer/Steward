import { Icon } from "./Icon";

/** An icon + title + subtitle row matching the native DolorSitScreen row. */
export function Row({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="row">
      <span className="row-icon">
        <Icon name={icon} />
      </span>
      <span className="row-text">
        <span className="row-title">{title}</span>
        <span className="row-subtitle">{subtitle}</span>
      </span>
    </div>
  );
}
