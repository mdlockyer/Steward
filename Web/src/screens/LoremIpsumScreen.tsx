import { Card } from "../components/Card";

// Same copy as the native Sources/Screens/LoremIpsumScreen.swift.
const cards = [
  {
    title: "Consectetur Adipiscing",
    body: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
  },
  {
    title: "Ullamco Laboris",
    body: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.",
  },
  {
    title: "Sunt in Culpa",
    body: "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ut perspiciatis unde omnis iste natus error.",
  },
  {
    title: "Officia Deserunt",
    body: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
  },
  {
    title: "Nemo Enim Ipsam",
    body: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est.",
  },
  {
    title: "Veritatis et Quasi",
    body: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit.",
  },
  {
    title: "Architecto Beatae",
    body: "Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit. Ut labore et dolore magnam aliquam quaerat voluptatem.",
  },
];

export function LoremIpsumScreen() {
  return (
    <div className="screen">
      <div className="screen-content">
        <h1 className="large-title">Lorem Ipsum</h1>
        <div className="cards">
          {cards.map((card) => (
            <Card key={card.title} title={card.title} body={card.body} />
          ))}
        </div>
      </div>
    </div>
  );
}
