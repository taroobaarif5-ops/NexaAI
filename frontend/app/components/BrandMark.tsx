type BrandMarkProps = {
  className?: string;
};

export default function BrandMark({ className = "" }: BrandMarkProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none">
      <rect width="32" height="32" rx="10" fill="#111713" />
      <path d="M9 23V9l14 14V9" stroke="#F4F8F5" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 9l14 14" stroke="#62D88C" strokeWidth="2.7" strokeLinecap="round" />
      <circle cx="23" cy="9" r="2" fill="#62D88C" />
    </svg>
  );
}
