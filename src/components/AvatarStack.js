const PALETTE = ["#2f6b3a", "#b67410", "#285e7a", "#b04141", "#5a4a8a", "#1f5f5f", "#8a4a4a"];

function colorFor(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export default function AvatarStack({ people, max = 4, size = 26 }) {
  const visible = people.slice(0, max);
  const remaining = people.length - visible.length;
  return (
    <div className="flex items-center">
      {visible.map((p, i) => (
        <div
          key={p.id ?? i}
          title={p.name}
          className="rounded-full flex items-center justify-center text-white font-semibold border-2 border-paper transition-transform hover:-translate-y-0.5 hover:z-10"
          style={{
            background: colorFor(p.name),
            width: size,
            height: size,
            fontSize: size * 0.4,
            marginLeft: i === 0 ? 0 : -8,
          }}
        >
          {initials(p.name)}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className="rounded-full flex items-center justify-center font-medium border-2 border-paper bg-paper-2 text-muted"
          style={{ width: size, height: size, fontSize: size * 0.34, marginLeft: -8 }}
          title={`${remaining} more`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
