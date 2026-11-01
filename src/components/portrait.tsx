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
  const i = ids.indexOf(id);
  if (i < 0)
    return (
      <div
        className="typographic-portrait"
        aria-label={`${name}. Каталожная композиция без вымышленного портрета`}
        role="img"
      >
        <span aria-hidden="true">
          {name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")}
        </span>
        <small>ДЕЙСТВУЮЩЕЕ ЛИЦО</small>
      </div>
    );
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
