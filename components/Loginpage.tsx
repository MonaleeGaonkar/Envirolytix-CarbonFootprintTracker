import React, { useState, useEffect, useRef } from "react";
import ThemeToggle from "./ThemeToggle";
import Button from "./ui/Button";
import * as auth from '../services/authService';

interface LoginPageProps {
  onLogin: (user: any, token?: string) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const LoginPage = ({ onLogin, theme, toggleTheme }: LoginPageProps) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    location: "Pune, Maharashtra, IN",
  });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isTypingPassword, setIsTypingPassword] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const leftSideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
    }, Math.random() * 4000 + 4000);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (leftSideRef.current) {
        const rect = leftSideRef.current.getBoundingClientRect();
        setMousePos({
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const resp = await auth.login({ email: formData.email, password: formData.password });
        onLogin(resp.user, resp.token);
        localStorage.setItem('token', resp.token);
        localStorage.setItem('user', JSON.stringify(resp.user));
      } else {
        const resp = await auth.register({ email: formData.email, password: formData.password, name: formData.name, location: formData.location });
        onLogin(resp.user, resp.token);
        localStorage.setItem('token', resp.token);
        localStorage.setItem('user', JSON.stringify(resp.user));
      }
    } catch (err: any) {
        console.error('Auth error', err);
      const errorMessage = err?.message || 'Authentication failed';
      const cleanMessage = errorMessage.replace('Login failed: ', '').replace('Register failed: ', '');
      alert(cleanMessage);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handlePasswordFocus = () => setIsTypingPassword(true);
  const handlePasswordBlur = () => setIsTypingPassword(false);

  const getEyePosition = (maxMove = 7) => {
    const moveX = isTypingPassword ? -mousePos.x : mousePos.x;
    const moveY = isTypingPassword ? -mousePos.y : mousePos.y;
    const distance = Math.sqrt(moveX ** 2 + moveY ** 2);
    const maxDistance = 300;
    const normalized = Math.min(distance / maxDistance, 1);
    return {
      x: (moveX / distance) * maxMove * normalized || 0,
      y: (moveY / distance) * maxMove * normalized || 0,
    };
  };

  const eyePos = getEyePosition();

  const Ghost = ({
    size = "normal",
    zIndex = 1,
    height = 160,
    blink = false,
    animationStyle = {},
  }: {
    size?: "small" | "normal" | "large";
    zIndex?: number;
    height?: number;
    blink?: boolean;
    animationStyle?: React.CSSProperties;
  }) => {
    const sizes = {
      small: "w-24",
      normal: "w-28",
      large: "w-32",
    };

    const eyeSizes = {
      small: { width: 14, height: 18, pupil: 6 },
      normal: { width: 18, height: 22, pupil: 8 },
      large: { width: 22, height: 26, pupil: 10 },
    };

    const smileHeights = { small: 8, normal: 10, large: 12 };
    const smileWidths = { small: 30, normal: 38, large: 46 };

    const { width: eyeWidth, height: eyeHeight, pupil: pupilSize } =
      eyeSizes[size];

    const smileH = smileHeights[size];
    const smileW = smileWidths[size];

    return (
      <div
        className={`${sizes[size]} relative flex flex-col justify-end ${isTypingPassword ? "is-shy" : ""}`}
        style={{ height: `${height}px`, zIndex, ...animationStyle }}
      >
        <div className="w-full h-full bg-gradient-to-b from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-t-full relative shadow-xl">
          <div className="absolute bottom-0 left-0 right-0 h-6 flex justify-around">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-1/4 h-full bg-gradient-to-b from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-b-full" />
            ))}
          </div>

          <div className="absolute top-[30%] left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
            {[0, 1].map((i) => (
              <div key={i} className={`bg-white rounded-full shadow-inner relative transition-all duration-200 overflow-hidden ${blink ? "animate-blink" : ""}`} style={{ width: eyeWidth, height: eyeHeight, boxShadow: "inset 0 0 3px rgba(0,0,0,0.3)" }}>
                {!blink && (
                  <div
                    className="absolute bg-gray-900 rounded-full transition-transform duration-200 ease-out"
                    style={{
                      width: pupilSize,
                      height: pupilSize,
                      top: `calc(50% - ${pupilSize / 2}px + ${eyePos.y}px)`,
                      left: `calc(50% - ${pupilSize / 2}px + ${eyePos.x}px)`,
                    }}
                  >
                    <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-80"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {isTypingPassword && (
            <>
              <div className="absolute top-[22%] left-5 w-3.5 h-[2px] bg-black/80 rounded-full rotate-[-20deg]" />
              <div className="absolute top-[22%] right-5 w-3.5 h-[2px] bg-black/80 rounded-full rotate-[20deg]" />
              <div className="absolute top-[48%] left-[18%] w-4 h-3 bg-pink-400 rounded-full opacity-70 animate-pulse"></div>
              <div className="absolute top-[48%] right-[18%] w-4 h-3 bg-pink-400 rounded-full opacity-70 animate-pulse"></div>
            </>
          )}

          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ bottom: `${height * 0.35}px` }}>
            <svg width={smileW} height={smileH + 6} viewBox={`0 0 ${smileW} ${smileH + 6}`} fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform duration-300" style={{ transform: isTypingPassword ? "scaleX(0.8) translateY(2px)" : "scale(1)" }}>
              <path d={`M2,2 Q${smileW / 2},${smileH + 2} ${smileW - 2},2`} stroke="#1f2937" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-900 flex overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>

      <div ref={leftSideRef} className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-8 relative">
        <div className="mb-6 text-center z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-6xl animate-earth-rotate inline-block">🌍</span>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400">
              ENVIRO-LYTIX
            </h1>
          </div>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium">
            {isTypingPassword ? "Oops! We won't peek! 🙈" : "Hey! We're watching you! 👀"}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isTypingPassword ? "Privacy matters to us!" : "Move your cursor around!"}
          </p>
        </div>

        <div className="relative flex items-end justify-center gap-[-25px]">
          <div className="flex items-end relative">
            <div style={{ zIndex: 10 }}>
              <Ghost size="small" height={180} zIndex={10} />
            </div>
            <div style={{ zIndex: 15, marginLeft: "-25px" }}>
              <Ghost size="normal" height={230} zIndex={15} />
            </div>
            <div style={{ zIndex: 20, marginLeft: "-30px" }}>
              <Ghost size="large" height={300} zIndex={20} blink={isBlinking} />
            </div>
            <div style={{ zIndex: 15, marginLeft: "-30px" }}>
              <Ghost size="normal" height={260} zIndex={15} />
            </div>
            <div style={{ zIndex: 10, marginLeft: "-25px" }}>
              <Ghost size="small" height={200} zIndex={10} />
            </div>
          </div>

          <div className="absolute bottom-[-25px] left-0 right-0 h-10 bg-gradient-to-t from-black/15 via-black/5 to-transparent rounded-full blur-lg"></div>
        </div>

        <div className="mt-8 text-center max-w-md">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            💡 Fun Fact: These eco-ghosts help track your carbon footprint. They're shy about passwords though! 😊
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <Button onClick={() => setIsLogin(true)} variant={isLogin ? "primary" : "ghost"} className="flex-1">Login</Button>
            <Button onClick={() => setIsLogin(false)} variant={!isLogin ? "primary" : "ghost"} className="flex-1">Sign Up</Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" placeholder="John Doe" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                Password
                {isTypingPassword && <span className="text-xs text-pink-500">🙈 We're not looking!</span>}
              </label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} onFocus={handlePasswordFocus} onBlur={handlePasswordBlur} minLength={6} className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition" placeholder="••••••••" />
            </div>
            <Button type="submit" variant="primary" className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
              {isLogin ? "🚀 Login" : "🌱 Sign Up"}
            </Button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes shyWobble { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
        .is-shy { animation: shyWobble 0.6s ease-in-out infinite; }
        @keyframes blink { 0%, 90%, 100% { height: 100%; } 95% { height: 10%; } }
        .animate-blink { animation: blink 5s infinite; }
      `}</style>
    </div>
  );
};

export default LoginPage;
