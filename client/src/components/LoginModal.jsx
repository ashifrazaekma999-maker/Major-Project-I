import React, { useState, useEffect } from 'react';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [step, setStep] = useState(1); // 1: ID+Password+Captcha, 2: 4-digit PIN
  const [demoOfficers, setDemoOfficers] = useState([]);

  // Form states
  const [officerId, setOfficerId] = useState('OFFICER-001');
  const [password, setPassword] = useState('Password@123');
  const [pin, setPin] = useState(['2', '6', '1', '8']);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaProblem, setCaptchaProblem] = useState({ q: '4 + 7', a: '11' });
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Signup form states
  const [signupForm, setSignupForm] = useState({
    officerId: 'OFFICER-099',
    name: 'Inspector Arjun Singhania',
    email: 'arjun.singh@police.gov.in',
    department: 'D001',
    role: 'Investigator',
    password: 'Password@123',
    pin: '2618',
    passKey: 'NETRISH2026'
  });

  useEffect(() => {
    generateCaptcha();
    fetch('/api/auth/demo-officers')
      .then(res => res.json())
      .then(data => {
        if (data.success) setDemoOfficers(data.officers);
      })
      .catch(() => {});
  }, []);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 8) + 2;
    const n2 = Math.floor(Math.random() * 8) + 2;
    setCaptchaProblem({ q: `${n1} + ${n2}`, a: String(n1 + n2) });
    setCaptchaAnswer('');
  };

  const handleSelectDemoOfficer = (officer) => {
    setOfficerId(officer.id);
    setPassword(officer.defaultPassword);
    setPin(officer.pin.split(''));
    setErrorMsg('');
  };

  const handleStep1Submit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (captchaAnswer.trim() !== captchaProblem.a) {
      setErrorMsg('Incorrect Security CAPTCHA verification code.');
      generateCaptcha();
      return;
    }

    if (!officerId.trim() || !password.trim()) {
      setErrorMsg('Please enter both Officer ID and Password.');
      return;
    }

    // Advance to Step 2: 4-Digit Security PIN
    setStep(2);
  };

  const handlePinChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const fullPin = pin.join('');

    if (fullPin.length !== 4) {
      setErrorMsg('Please enter the complete 4-digit Tactical PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officerId,
          password,
          pin: fullPin,
          captchaAnswer,
          captchaExpected: captchaProblem.a
        })
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.user, data.token);
        onClose();
      } else {
        setErrorMsg(data.message || 'Authentication rejected by security mainframe.');
      }
    } catch {
      setErrorMsg('Network error connecting to NETRISH Central Auth Server.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm)
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setMode('login');
        setStep(1);
        setOfficerId(signupForm.officerId);
        setPassword(signupForm.password);
      } else {
        setErrorMsg(data.message || 'Enrollment rejected.');
      }
    } catch {
      setErrorMsg('Failed to enroll officer.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b1329] border border-cyan-500/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl shadow-cyan-900/30">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-[#0b1329] to-slate-900 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              🛡️
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide font-mono">NETRISH ACCESS GATE</h2>
              <p className="text-[11px] text-slate-400">National Law Enforcement Authentication Layer</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-lg">✕</button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-[#070b16]">
          <button
            onClick={() => { setMode('login'); setStep(1); setErrorMsg(''); }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
              mode === 'login' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Officer Sign In (2FA)
          </button>
          <button
            onClick={() => { setMode('signup'); setErrorMsg(''); }}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
              mode === 'signup' ? 'border-cyan-400 text-cyan-400 bg-slate-900/40' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Department Enrollment
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 bg-red-950/70 border border-red-500/60 text-red-200 text-xs p-3 rounded-lg flex items-center space-x-2">
              <span>⚠️</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {mode === 'login' ? (
            step === 1 ? (
              <form onSubmit={handleStep1Submit} className="space-y-4">
                {/* Demo Quick Switcher */}
                {demoOfficers.length > 0 && (
                  <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
                    <div className="text-[11px] text-cyan-400 font-mono font-semibold mb-2 flex items-center justify-between">
                      <span>⚡ EVALUATION QUICK LOGIN (1-CLICK SELECT):</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {demoOfficers.map(o => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => handleSelectDemoOfficer(o)}
                          className={`text-left p-2 rounded border text-[11px] transition ${
                            officerId === o.id
                              ? 'border-cyan-400 bg-cyan-950/40 text-cyan-300'
                              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-300'
                          }`}
                        >
                          <div className="font-semibold truncate">{o.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{o.role} • {o.id}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">OFFICER / BADGE ID</label>
                  <input
                    type="text"
                    value={officerId}
                    onChange={(e) => setOfficerId(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                    placeholder="e.g. OFFICER-001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">PASSWORD</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-400 rounded-lg px-3 py-2 text-sm text-white font-mono outline-none"
                    placeholder="••••••••••••"
                  />
                </div>

                {/* Tactical CAPTCHA */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-slate-400">TACTICAL CAPTCHA VERIFICATION</span>
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      className="text-[10px] text-cyan-400 hover:underline font-mono"
                    >
                      ↻ Refresh Challenge
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="bg-slate-950 border border-cyan-500/40 px-4 py-2 rounded font-mono text-base font-bold text-cyan-300 tracking-wider select-none">
                      {captchaProblem.q} = ?
                    </div>
                    <input
                      type="text"
                      value={captchaAnswer}
                      onChange={(e) => setCaptchaAnswer(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded px-3 py-2 text-sm text-white font-mono outline-none"
                      placeholder="Enter result..."
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase font-mono rounded-lg shadow-lg shadow-cyan-600/20 transition"
                >
                  PROCEED TO SECURITY PIN (STEP 2) →
                </button>
              </form>
            ) : (
              /* Step 2: 4-Digit Security PIN */
              <form onSubmit={handlePinSubmit} className="space-y-6 text-center">
                <div className="space-y-1">
                  <div className="w-12 h-12 mx-auto rounded-full bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xl">
                    🔐
                  </div>
                  <h3 className="text-sm font-bold text-white font-mono">ENTER 4-DIGIT NETRISH PIN</h3>
                  <p className="text-xs text-slate-400">
                    Secondary authorization factor for Officer: <span className="text-cyan-300 font-mono">{officerId}</span>
                  </p>
                </div>

                {/* PIN Input digits */}
                <div className="flex justify-center space-x-3">
                  {[0, 1, 2, 3].map(idx => (
                    <input
                      key={idx}
                      id={`pin-input-${idx}`}
                      type="password"
                      maxLength={1}
                      value={pin[idx] || ''}
                      onChange={(e) => handlePinChange(idx, e.target.value)}
                      className="w-12 h-14 bg-slate-900 border-2 border-slate-700 focus:border-cyan-400 text-center text-2xl font-mono font-bold text-cyan-400 rounded-lg outline-none transition"
                    />
                  ))}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold rounded-lg transition"
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase font-mono rounded-lg shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
                  >
                    {loading ? 'VERIFYING PIN...' : 'UNLOCK TERMINAL ⚡'}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Signup / Department Enrollment */
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">OFFICER BADGE ID</label>
                  <input
                    type="text"
                    value={signupForm.officerId}
                    onChange={(e) => setSignupForm({ ...signupForm, officerId: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">FULL NAME & RANK</label>
                  <input
                    type="text"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">DEPARTMENT UNIT</label>
                  <select
                    value={signupForm.department}
                    onChange={(e) => setSignupForm({ ...signupForm, department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="D001">D001 - Special Cyber Crime Cell</option>
                    <option value="D002">D002 - Financial Intelligence Unit</option>
                    <option value="D003">D003 - Narcotics Control Wing</option>
                    <option value="D005">D005 - State Intelligence Directorate</option>
                    <option value="D010">D010 - Special Task Force (STF)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">ROLE CLEARANCE</label>
                  <select
                    value={signupForm.role}
                    onChange={(e) => setSignupForm({ ...signupForm, role: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="Investigator">Investigator</option>
                    <option value="Department Admin">Department Admin</option>
                    <option value="Security Guardian">Security Guardian</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-300 mb-1">OFFICIAL EMAIL</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">PASSWORD</label>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 mb-1">4-DIGIT PIN</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={signupForm.pin}
                    onChange={(e) => setSignupForm({ ...signupForm, pin: e.target.value })}
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-amber-400 mb-1">
                  DEPARTMENT ENROLLMENT PASS KEY (SIH SECRET)
                </label>
                <input
                  type="text"
                  value={signupForm.passKey}
                  onChange={(e) => setSignupForm({ ...signupForm, passKey: e.target.value })}
                  placeholder="e.g. NETRISH2026"
                  required
                  className="w-full bg-slate-900 border border-amber-500/50 rounded px-2.5 py-1.5 text-xs text-amber-300 font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs tracking-wider uppercase font-mono rounded-lg transition"
              >
                {loading ? 'ENROLLING OFFICER...' : 'SUBMIT DEPARTMENT ENROLLMENT'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
