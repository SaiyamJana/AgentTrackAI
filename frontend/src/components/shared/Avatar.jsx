// Avatar — generates initials avatar with consistent color per name
const colors = [
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-teal-100 text-teal-700",
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const getColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const sizeMap = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

const Avatar = ({ name, size = "md", className = "" }) => {
  const initials = getInitials(name);
  const color = getColor(name);
  const sizeClass = sizeMap[size] || sizeMap.md;

  return (
    <div
      className={`rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${color} ${sizeClass} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;
