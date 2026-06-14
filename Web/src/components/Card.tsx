/** A titled card matching the native LoremIpsumScreen card. */
export function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="card">
      <h2 className="card-title">{title}</h2>
      <p className="card-body">{body}</p>
    </div>
  );
}
