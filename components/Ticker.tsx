"use client";

type Props = { total: number };

export function Ticker({ total }: Props) {
  const items = ["Tijmens Fijne Sites", `${total} sites`, "Webinspiratie", "Klik en kijk", "Snapshots van de homepage"];
  const seq = [...items, ...items];
  return (
    <div className="ticker" aria-hidden data-fade>
      <div className="ticker__track">
        {[0, 1].map((k) => (
          <span key={k} style={{ display: "inline-flex" }}>
            {seq.map((t, i) => (
              <span className="ticker__item" key={`${k}-${i}`}>
                {t}
                <i>◆</i>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  );
}
