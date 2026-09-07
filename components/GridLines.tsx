/** Faint column lines behind the whole page. Twelve on desktop, fewer on small screens (see CSS). */
export function GridLines() {
  return (
    <div className="gridlines" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}
