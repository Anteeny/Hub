interface BackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function BackButton({ onClick, label = "Home", className = "" }: BackButtonProps) {
  return (
    <button
      type="button"
      className={`app-back-btn ${className}`}
      onClick={onClick}
      aria-label={`Back to ${label}`}
      title={`Back to ${label}`}
    >
      <span className="app-back-btn-icon" aria-hidden="true">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </span>
      <span className="app-back-btn-label">{label}</span>
    </button>
  );
}

export default BackButton;
