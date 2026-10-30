const ids = [
  "fyodor",
  "dmitri",
  "ivan",
  "alexei",
  "smerdyakov",
  "grushenka",
  "katerina",
  "zosima",
  "ilyusha",
  "snegiryov",
  "rakitin",
  "liza",
];
export function Portrait({ id, name }: { id: string; name: string }) {
  const i = Math.max(0, ids.indexOf(id));
  return (
    <div
      role="img"
      aria-label={`${name}. Современная цифровая иллюстрация`}
      className="character-portrait"
      style={{
        backgroundImage: "url(/images/portraits.webp)",
        backgroundPosition: `${((i % 4) * 100) / 3}% ${Math.floor(i / 4) * 50}%`,
      }}
    />
  );
}
