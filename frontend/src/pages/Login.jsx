import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { Eye, EyeOff, Loader2, LogIn, CheckCircle, X, KeyRound } from 'lucide-react';

/* ─── Refined Architectural Transportation Scene ─── */
function CampusScene() {
  const roadRef = useRef(null);
  const busRef = useRef(null);
  const rearWheelRef = useRef(null);
  const frontWheelRef = useRef(null);

  useEffect(() => {
    const road = roadRef.current;
    const bus = busRef.current;
    if (!road || !bus) return;

    let totalLength = 0;
    try {
      totalLength = road.getTotalLength();
    } catch {
      return;
    }
    if (!totalLength) return;

    // Helper: update bus position, orientation, and wheel rotation along the road's upper driving surface
    const setBusAtDistance = (dist) => {
      const delta = 2;
      const pt = road.getPointAtLength(dist);
      const ptFwd = road.getPointAtLength(Math.min(dist + delta, totalLength));
      const ptBack = road.getPointAtLength(Math.max(dist - delta, 0));
      const dx = ptFwd.x - ptBack.x;
      const dy = ptFwd.y - ptBack.y;
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      // Origin of the bus is exactly at the wheels' ground contact point (y = 0)
      bus.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${angle})`);

      // Wheel rotation matching road travel speed (wheel radius = 5px)
      const wheelDeg = (dist / (2 * Math.PI * 5)) * 360;
      if (rearWheelRef.current) {
        rearWheelRef.current.setAttribute('transform', `rotate(${wheelDeg}, -18, -5)`);
      }
      if (frontWheelRef.current) {
        frontWheelRef.current.setAttribute('transform', `rotate(${wheelDeg}, 18, -5)`);
      }
    };

    // Default static position (centered naturally between Main Gate and Campus Quad)
    setBusAtDistance(totalLength * 0.48);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let animId;
    let startTime = null;
    const DURATION = 16000; // 16 seconds smooth transit loop

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % DURATION) / DURATION;
      const currentDist = progress * totalLength;

      setBusAtDistance(currentDist);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="campus-scene-wrap" aria-hidden="true">
      <svg
        className="campus-svg"
        viewBox="0 0 540 260"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="roadSurfaceGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E8D2B5" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#EFE5D8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#E8D2B5" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="busBodyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#82110f" />
            <stop offset="100%" stopColor="#690907" />
          </linearGradient>
          <linearGradient id="busRoofGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FAF6F0" />
            <stop offset="100%" stopColor="#E8D2B5" />
          </linearGradient>
        </defs>

        {/* ── Distant Architectural Skyline (Minimalist Campus Facades) ── */}
        <g opacity="0.85">
          {/* Main Academic Hall (Left) */}
          <rect x="25" y="85" width="75" height="110" rx="3" fill="#FAF6F0" stroke="#A5A79B" strokeWidth="1" strokeOpacity="0.35" />
          <rect x="25" y="82" width="75" height="5" rx="1.5" fill="#690907" fillOpacity="0.2" />
          {[0, 1, 2].map((col) =>
            [0, 1, 2, 3].map((row) => (
              <rect
                key={`a-${col}-${row}`}
                x={36 + col * 20}
                y={98 + row * 20}
                width="11"
                height="12"
                rx="2"
                fill={row % 2 === 0 ? '#EFE5D8' : '#FAF6F0'}
                stroke="#A5A79B"
                strokeWidth="0.8"
                strokeOpacity="0.3"
              />
            ))
          )}

          {/* Central Clocktower / Library Pavilion */}
          <rect x="120" y="112" width="55" height="78" rx="3" fill="#EFE5D8" fillOpacity="0.6" stroke="#A5A79B" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M 120 112 L 147.5 90 L 175 112 Z" fill="#E8D2B5" stroke="#A5A79B" strokeWidth="1" strokeOpacity="0.35" />
          <circle cx="147.5" cy="103" r="4.5" fill="#FAF6F0" stroke="#690907" strokeWidth="1" strokeOpacity="0.5" />
          {[0, 1].map((c) =>
            [0, 1, 2].map((r) => (
              <rect
                key={`b-${c}-${r}`}
                x={131 + c * 20}
                y={124 + r * 18}
                width="10"
                height="11"
                rx="1.5"
                fill="#FAF6F0"
                stroke="#A5A79B"
                strokeWidth="0.6"
                strokeOpacity="0.25"
              />
            ))
          )}

          {/* Right Campus Pavilion */}
          <rect x="425" y="105" width="85" height="88" rx="3" fill="#FAF6F0" stroke="#A5A79B" strokeWidth="1" strokeOpacity="0.35" />
          <rect x="425" y="102" width="85" height="5" rx="1.5" fill="#A5A79B" fillOpacity="0.25" />
          {[0, 1, 2].map((col) =>
            [0, 1, 2].map((row) => (
              <rect
                key={`c-${col}-${row}`}
                x={438 + col * 24}
                y={118 + row * 20}
                width="12"
                height="12"
                rx="2"
                fill="#EFE5D8"
                stroke="#A5A79B"
                strokeWidth="0.8"
                strokeOpacity="0.3"
              />
            ))
          )}
        </g>

        {/* ── Minimalist Campus Trees (Sage geometric foliage) ── */}
        <g opacity="0.8">
          <line x1="110" y1="195" x2="110" y2="170" stroke="#8C827A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="110" cy="162" r="13" fill="#A5A79B" fillOpacity="0.4" />
          <circle cx="110" cy="160" r="9" fill="#A5A79B" fillOpacity="0.55" />

          <line x1="412" y1="192" x2="412" y2="168" stroke="#8C827A" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="412" cy="160" r="14" fill="#A5A79B" fillOpacity="0.45" />

          <line x1="318" y1="168" x2="318" y2="148" stroke="#8C827A" strokeWidth="2" strokeLinecap="round" />
          <circle cx="318" cy="142" r="10" fill="#A5A79B" fillOpacity="0.35" />
        </g>

        {/* ── Road Pavement Band (Solid driving surface under the wheels) ── */}
        <path
          d="M -40 195 C 110 195 170 155 265 155 C 360 155 410 192 580 192 L 580 216 C 410 216 360 179 265 179 C 170 179 110 219 -40 219 Z"
          fill="url(#roadSurfaceGrad)"
        />
        {/* Lower Road Curb Edge */}
        <path
          d="M -40 219 C 110 219 170 179 265 179 C 360 179 410 216 580 216"
          stroke="#A5A79B"
          strokeWidth="1.2"
          strokeOpacity="0.4"
          fill="none"
        />
        {/* Road Lane Center Dashed Divider */}
        <path
          d="M -40 206 C 110 206 170 166 265 166 C 360 166 410 203 580 203"
          stroke="#FFFFFF"
          strokeOpacity="0.8"
          strokeWidth="1.8"
          strokeDasharray="12 10"
          fill="none"
        />

        {/* ── Road Upper Driving Surface (The exact track the wheels roll upon) ── */}
        <path
          ref={roadRef}
          id="road-surface-track"
          d="M -40 195 C 110 195 170 155 265 155 C 360 155 410 192 580 192"
          stroke="#B8AA99"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* ── Subtle Burgundy Tracking Line (Active transit cue) ── */}
        <path
          d="M -40 195 C 110 195 170 155 265 155 C 360 155 410 192 580 192"
          stroke="#690907"
          strokeOpacity="0.3"
          strokeWidth="1.5"
          strokeDasharray="5 5"
          fill="none"
        />

        {/* ── Location Marker A (Main Gate) ── */}
        <g transform="translate(120, 191)">
          <circle cx="0" cy="0" r="9" className="pin-pulse" fill="#690907" fillOpacity="0.2" />
          <path
            d="M 0 -16 C -5 -16 -9 -12 -9 -7 C -9 -1 0 0 0 0 C 0 0 9 -1 9 -7 C 9 -12 5 -16 0 -16 Z"
            fill="#690907"
          />
          <circle cx="0" cy="-8" r="2.5" fill="#FAF6F0" />
          <text x="0" y="24" textAnchor="middle" fill="#5A534C" fontSize="9" fontWeight="600" letterSpacing="0.02em">
            Main Gate
          </text>
        </g>

        {/* ── Location Marker B (Campus Quad) ── */}
        <g transform="translate(420, 188)">
          <path
            d="M 0 -16 C -5 -16 -9 -12 -9 -7 C -9 -1 0 0 0 0 C 0 0 9 -1 9 -7 C 9 -12 5 -16 0 -16 Z"
            fill="#690907"
          />
          <circle cx="0" cy="-8" r="2.5" fill="#FAF6F0" />
          <text x="0" y="24" textAnchor="middle" fill="#5A534C" fontSize="9" fontWeight="600" letterSpacing="0.02em">
            Campus Quad
          </text>
        </g>

        {/* ══════════════════════════════════════════════════════════════════════════════
            THE MODERN COLLEGE SHUTTLE BUS (Directly on road surface with wheel contact)
           ══════════════════════════════════════════════════════════════════════════════ */}
        <g ref={busRef} className="animated-bus" transform="translate(265, 155)">
          {/* Contact ground shadow on road surface */}
          <ellipse cx="0" cy="0.5" rx="26" ry="1.8" fill="rgba(41,37,34,0.18)" />

          {/* Lower Chassis: Deep Burgundy (y: -19 to -5) */}
          <rect x="-30" y="-19" width="60" height="14" rx="3.5" fill="url(#busBodyGrad)" />

          {/* Upper Cabin: Warm Cream / Ivory (y: -29 to -19) */}
          <path d="M -26 -19 L -23 -29 L 20 -29 L 28 -19 Z" fill="url(#busRoofGrad)" stroke="#A5A79B" strokeWidth="0.5" strokeOpacity="0.4" />

          {/* Aerodynamic Front Windshield */}
          <path d="M 18 -28 L 26 -19 L 20 -19 L 14 -28 Z" fill="#292522" fillOpacity="0.75" />

          {/* Passenger Windows */}
          <rect x="-21" y="-27" width="9" height="7" rx="1.5" fill="#292522" fillOpacity="0.7" />
          <rect x="-9" y="-27" width="9" height="7" rx="1.5" fill="#292522" fillOpacity="0.7" />
          <rect x="3" y="-27" width="9" height="7" rx="1.5" fill="#292522" fillOpacity="0.7" />

          {/* Waistline Accent Stripe (Soft Sage) */}
          <rect x="-28" y="-14" width="56" height="1.5" rx="0.75" fill="#A5A79B" fillOpacity="0.9" />

          {/* Front Headlight (Warm soft beam onto road) */}
          <circle cx="29.5" cy="-12" r="1.5" fill="#FFFDF8" />
          <path d="M 30 -13 L 42 -16 L 42 -7 L 30 -11 Z" fill="#E8D2B5" fillOpacity="0.25" />

          {/* Rear Taillight */}
          <rect x="-30" y="-15" width="1.5" height="4" rx="0.5" fill="#E53935" />

          {/* ── Rear Wheel (center: -18, -5; radius: 5; ground contact at y: 0) ── */}
          <g ref={rearWheelRef}>
            <circle cx="-18" cy="-5" r="5" fill="#292522" />
            <circle cx="-18" cy="-5" r="2.5" fill="#A5A79B" />
            <line x1="-18" y1="-9.5" x2="-18" y2="-0.5" stroke="#292522" strokeWidth="0.8" />
            <line x1="-22.5" y1="-5" x2="-13.5" y2="-5" stroke="#292522" strokeWidth="0.8" />
          </g>

          {/* ── Front Wheel (center: 18, -5; radius: 5; ground contact at y: 0) ── */}
          <g ref={frontWheelRef}>
            <circle cx="18" cy="-5" r="5" fill="#292522" />
            <circle cx="18" cy="-5" r="2.5" fill="#A5A79B" />
            <line x1="18" y1="-9.5" x2="18" y2="-0.5" stroke="#292522" strokeWidth="0.8" />
            <line x1="13.5" y1="-5" x2="22.5" y2="-5" stroke="#292522" strokeWidth="0.8" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MAIN LOGIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const Login = () => {
  const [username, setUsername]                     = useState('');
  const [password, setPassword]                     = useState('');
  const [showPassword, setShowPassword]             = useState(false);
  const [error, setError]                           = useState('');
  const [isLoading, setIsLoading]                   = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotIdentifier, setForgotIdentifier]     = useState('');
  const [forgotLoading, setForgotLoading]           = useState(false);
  const [forgotResult, setForgotResult]             = useState(null);
  const { login, user } = useAuth();

  const targetPath = useMemo(() => {
    if (!user) return null;
    if (user.role === 'admin')   return '/admin';
    if (user.role === 'driver')  return '/driver';
    if (user.role === 'student') return '/student';
    return '/login';
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ username, password });
    } catch (err) {
      console.error('Auth error:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error   ||
        err.message                 ||
        'Login failed';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const openForgotPassword  = () => { setShowForgotPassword(true); setForgotIdentifier(''); setForgotResult(null); };
  const closeForgotPassword = () => { setShowForgotPassword(false); setForgotIdentifier(''); setForgotResult(null); setForgotLoading(false); };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) return;
    setForgotLoading(true);
    setForgotResult(null);
    try {
      const res = await api.post('/auth/forgot-password', { identifier: forgotIdentifier.trim() });
      setForgotResult({ type: 'success', message: res.data.message || 'Check your email for the password.' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Try again.';
      setForgotResult({ type: 'error', message: msg });
    } finally {
      setForgotLoading(false);
    }
  };

  if (targetPath) return <Navigate to={targetPath} replace />;

  return (
    <main className="login-page">

      {/* ═══ LEFT HERO PANEL (Refined Editorial & Spacious) ═══ */}
      <div className="login-hero">
        <div className="login-hero-content">
          <div className="login-hero-logo-wrap">
            <img src="/logohorigental.svg" alt="Where Is My Bus" className="login-hero-logo" />
          </div>

          <h1 className="login-hero-title">
            Smart Bus Tracking<br />
            <span className="text-[#690907] font-serif italic font-normal">Made Simple</span>
          </h1>
          <p className="login-hero-subtitle">Track. Ride. Arrive safely.</p>

          <CampusScene />

          {/* At most two small, calm glassmorphic info chips */}
          <div className="login-status-row">
            <div className="login-status-chip">
              <span className="chip-dot-green" />
              <span>GPS Connected</span>
            </div>
            <div className="login-status-chip">
              <span className="chip-dot-burgundy" />
              <span>Live Fleet Tracking</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ RIGHT FORM PANEL (Clean, Focused, Elegant) ═══ */}
      <div className="login-form-panel">
        <div className="login-card login-card-animate">

          {/* Mobile-only logo banner */}
          <div className="lg:hidden mb-6 text-center">
            <img src="/logohorigental.svg" alt="Where Is My Bus" className="h-8 w-auto mx-auto object-contain" />
          </div>

          <div className="mb-7">
            <h2 className="login-card-title">Sign In</h2>
            <p className="login-card-subtitle">Enter your campus credentials to continue</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">Roll Number / Username</label>
              <input
                type="text"
                placeholder="Enter roll number or username"
                className="login-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                disabled={isLoading}
              />
            </div>

            <div className="login-field">
              <div className="flex items-center justify-between mb-1.5">
                <label className="login-label mb-0">Password</label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-xs font-semibold text-[#690907] hover:text-[#540705] transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="login-input pr-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C827A] hover:text-[#690907] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error login-card-animate">
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#690907]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={isLoading} className="login-btn-primary">
              {isLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" />Sign In</>
              )}
            </button>
          </form>

          <p className="login-footer-hint mt-6">
            Authorized student, driver and administrator access
          </p>
        </div>
      </div>

      {/* ═══ FORGOT PASSWORD MODAL ═══ */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={closeForgotPassword}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="login-modal login-card-animate" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={closeForgotPassword}
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#8C827A] hover:text-[#292522] hover:bg-[#EFE5D8] transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-[#690907]/10 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-[#690907]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#292522]">Reset Password</h3>
                <p className="text-xs text-[#8C827A]">We&apos;ll reset and email your credentials</p>
              </div>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="login-field">
                <label className="login-label">Roll Number or Email</label>
                <input
                  type="text"
                  placeholder="Enter your roll number or email"
                  className="login-input"
                  value={forgotIdentifier}
                  onChange={(e) => setForgotIdentifier(e.target.value)}
                  required
                  autoFocus
                  disabled={forgotLoading}
                />
              </div>

              {forgotResult && (
                <div className={`login-card-animate rounded-xl px-4 py-3 text-sm flex items-start gap-2 ${
                  forgotResult.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {forgotResult.type === 'success'
                    ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    : <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  }
                  <span>{forgotResult.message}</span>
                </div>
              )}

              {forgotResult?.type === 'success' ? (
                <button
                  type="button"
                  onClick={closeForgotPassword}
                  className="w-full rounded-xl bg-[#EFE5D8] py-3 text-[#292522] font-semibold hover:bg-[#E8D2B5] transition-all active:scale-[0.98]"
                >
                  Back to Sign In
                </button>
              ) : (
                <button type="submit" disabled={forgotLoading || !forgotIdentifier.trim()} className="login-btn-primary">
                  {forgotLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Sending...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Login;
