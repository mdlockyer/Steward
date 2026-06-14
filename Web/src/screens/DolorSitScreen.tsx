import { Fragment } from "react";
import { Row } from "../components/Row";

// Same copy as the native Sources/Screens/DolorSitScreen.swift. The `icon`
// keys map to the outline icons in ../icons (Lucide-style equivalents of the
// native SF Symbols).
const rows = [
  { icon: "file-text", title: "Lorem Ipsum Document", subtitle: "Dolor sit amet, consectetur adipiscing elit" },
  { icon: "folder", title: "Consectetur Folder", subtitle: "Sed do eiusmod tempor incididunt ut labore" },
  { icon: "star", title: "Adipiscing Favourite", subtitle: "Ut enim ad minim veniam quis exercitation" },
  { icon: "bookmark", title: "Dolore Magna Bookmark", subtitle: "Ullamco laboris nisi ut aliquip ex commodo" },
  { icon: "tag", title: "Magna Aliqua Tag", subtitle: "Duis aute irure dolor in reprehenderit" },
  { icon: "clock", title: "Voluptate History", subtitle: "Velit esse cillum dolore eu fugiat nulla" },
  { icon: "bell", title: "Pariatur Notification", subtitle: "Excepteur sint occaecat cupidatat non proident" },
  { icon: "user", title: "Culpa Qui Officia", subtitle: "Deserunt mollit anim id est laborum lorem" },
  { icon: "map", title: "Perspiciatis Unde", subtitle: "Omnis iste natus error sit voluptatem" },
  { icon: "image", title: "Accusantium Image", subtitle: "Doloremque laudantium totam rem aperiam" },
  { icon: "music", title: "Eaque Ipsa Audio", subtitle: "Quae ab illo inventore veritatis quasi" },
  { icon: "settings", title: "Architecto Beatae", subtitle: "Vitae dicta sunt explicabo nemo enim ipsam" },
];

export function DolorSitScreen() {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="large-title">Dolor Sit</h1>
        <div className="rows">
          {rows.map((row) => (
            <Fragment key={row.title}>
              <hr className="divider" />
              <Row icon={row.icon} title={row.title} subtitle={row.subtitle} />
            </Fragment>
          ))}
          <hr className="divider" />
        </div>
      </div>
    </div>
  );
}
