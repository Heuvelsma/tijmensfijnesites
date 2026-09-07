import { UnlockForm } from "./UnlockForm";

export const metadata = { title: "Tijmens Fijne Sites · Sleutel" };

export default function UnlockPage() {
  return (
    <main className="unlock">
      <h1 className="unlock__title" aria-label="Tijmens Fijne Sites">
        <span>
          <span className="squeeze">Tijmens</span>
        </span>
        <span>
          <span className="squeeze">Fijne Sites</span>
        </span>
      </h1>
      <UnlockForm />
    </main>
  );
}
