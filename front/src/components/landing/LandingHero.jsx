import './LandingHero.css';

function HeroIllustration() {
  return (
    <svg
      className="landing-hero__illustration"
      viewBox="0 0 360 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8F4E5" />
          <stop offset="100%" stopColor="#F5F0E8" />
        </linearGradient>
        <linearGradient id="hillGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A8C9A0" />
          <stop offset="100%" stopColor="#7A9B82" />
        </linearGradient>
      </defs>

      {/* sky & hills */}
      <rect width="360" height="200" fill="url(#skyGrad)" rx="16" />
      <ellipse cx="180" cy="210" rx="220" ry="80" fill="url(#hillGrad)" opacity="0.5" />
      <ellipse cx="80" cy="195" rx="120" ry="50" fill="#B8D4B0" opacity="0.6" />
      <ellipse cx="300" cy="190" rx="100" ry="45" fill="#9BB896" opacity="0.5" />

      {/* stream */}
      <path
        d="M0 165 Q40 155 80 160 T160 158 T240 162 T360 155 L360 200 L0 200 Z"
        fill="#A8D8EA"
        opacity="0.7"
      />
      <path
        d="M20 168 Q60 162 100 166 T180 164 T260 167 T340 160"
        stroke="#7EC8E3"
        strokeWidth="2"
        fill="none"
        opacity="0.5"
      />

      {/* tree */}
      <rect x="248" y="118" width="8" height="42" rx="2" fill="#8B6914" />
      <circle cx="252" cy="100" r="38" fill="#6BA368" opacity="0.9" />
      <circle cx="232" cy="108" r="28" fill="#7AB878" opacity="0.85" />
      <circle cx="272" cy="105" r="30" fill="#5A9B5E" opacity="0.9" />

      {/* figure & lambs — simplified, gentle shapes */}
      <ellipse cx="252" cy="158" rx="14" ry="6" fill="#D4C4A8" opacity="0.4" />
      {/* robe */}
      <path
        d="M238 130 Q252 122 266 130 L270 158 Q252 164 234 158 Z"
        fill="#D4B896"
      />
      {/* head */}
      <circle cx="252" cy="124" r="10" fill="#E8C9A0" />
      <path d="M244 122 Q252 116 260 122" stroke="#8B6914" strokeWidth="1.5" fill="none" />
      {/* lamb 1 */}
      <ellipse cx="228" cy="152" rx="10" ry="7" fill="#F5F5F0" />
      <circle cx="222" cy="148" r="5" fill="#F5F5F0" />
      <circle cx="220" cy="147" r="1" fill="#666" />
      {/* lamb 2 */}
      <ellipse cx="268" cy="154" rx="8" ry="6" fill="#F0EDE8" />
      <circle cx="273" cy="151" r="4" fill="#F0EDE8" />

      {/* flowers */}
      <circle cx="60" cy="172" r="3" fill="#F5E6A8" />
      <circle cx="75" cy="178" r="2.5" fill="#F8D4E8" />
      <circle cx="90" cy="174" r="2" fill="#FFF8DC" />
      <circle cx="130" cy="180" r="2.5" fill="#F5E6A8" />

      {/* sun glow */}
      <circle cx="320" cy="40" r="24" fill="#FFF8E7" opacity="0.8" />
      <circle cx="320" cy="40" r="14" fill="#FFE8A3" opacity="0.6" />
    </svg>
  );
}

export default function LandingHero() {
  return (
    <section className="landing-hero">
      <div className="landing-hero__visual">
        <HeroIllustration />
        <div className="landing-hero__text-overlay">
          <h1 className="landing-hero__headline">
            함께 말씀을 암송하고,
            <br />
            매일 인증하며,
            <br />
            서로 아멘으로 격려하는 암송방
          </h1>
          <div className="landing-hero__divider" aria-hidden="true">
            <span className="landing-hero__divider-line" />
            <span className="landing-hero__divider-heart">♥</span>
            <span className="landing-hero__divider-line" />
          </div>
          <p className="landing-hero__subheadline">
            시편의 평안한 감성으로,
            <br />
            매일 말씀을 기억하고 함께 걸어가요.
          </p>
        </div>
      </div>
    </section>
  );
}
