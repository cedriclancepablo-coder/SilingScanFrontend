export function SilingScanLogo({
  className = "h-6 w-6",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* scanner corners */}
      <path
        d="M4 10V6a2 2 0 0 1 2-2h4M22 4h4a2 2 0 0 1 2 2v4M28 22v4a2 2 0 0 1-2 2h-4M10 28H6a2 2 0 0 1-2-2v-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* chili */}
      <path
        d="M11 11c3-1.5 7 0 8.5 3.5 1.2 2.8.8 6-1 8.5-.4-3-2-5.5-4.5-7-1.5-.9-3-1.6-3-5Z"
        fill="#E11D48"
      />
      {/* stem */}
      <path
        d="M11 11c-.5-1.5 0-3 1.5-3.8"
        stroke="#16A34A"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
