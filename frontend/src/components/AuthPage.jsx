import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { getApiUrl } from '../config';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Authentication failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper fade-in" style={styles.container}>
      {/* Decorative gradient glowing spheres */}
      <div style={styles.glowOrb1}></div>
      <div style={styles.glowOrb2}></div>

      <div style={styles.grid} className="auth-grid">
        {/* Visual Info Panel */}
        <div style={styles.infoPanel} className="glass-panel auth-info-panel">
          <div style={styles.badgeContainer}>

            <span className="badge badge-progress" style={styles.tag}>
              <Sparkles size={12} style={{ marginRight: '4px' }} />
              Next-Gen Meeting Intelligence
            </span>
          </div>
          
          <h1 style={styles.infoTitle}>
            Turn Discussions <br />
            Into <span style={styles.highlightText}>Action Items</span>
          </h1>
          <p style={styles.infoText}>
            Our AI-powered platform makes meetings smarter, more productive, and outcome-driven. 
            Transcribe conversations in real-time, auto-extract action items, and track progress.
          </p>

          <div style={styles.featuresList}>
            <div style={styles.featureItem}>
              <div style={styles.featureDot}></div>
              <div>
                <strong style={styles.featureHeadline}>Real-Time Speech to Text</strong>
                <p style={styles.featureSub}>Accurate transcriptions with speaker tracking</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot}></div>
              <div>
                <strong style={styles.featureHeadline}>AI Summaries & Agenda</strong>
                <p style={styles.featureSub}>Never forget critical decisions or preparation briefs</p>
              </div>
            </div>
            <div style={styles.featureItem}>
              <div style={styles.featureDot}></div>
              <div>
                <strong style={styles.featureHeadline}>Auto Action Items</strong>
                <p style={styles.featureSub}>Extracts tasks and assigns them with deadlines</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Form Panel */}
        <div style={styles.formPanel} className="glass-panel">
          <div style={styles.formHeader}>
            <div style={styles.logoCircle}>
              <Sparkles size={22} color="#ffffff" />
            </div>
            <h2 style={styles.logoText}>AI Meeting</h2>
            <p style={styles.logoSubText}>
              {isLogin ? 'Welcome back! Sign in to your account.' : 'Create an account to get started.'}
            </p>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLogin && (
              <div className="form-group">
                <label htmlFor="reg-name">Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '44px' }}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="auth-email">Email Address</label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="auth-password">Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '44px' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="coral-glow-btn"
              style={styles.submitBtn}
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            {isLogin && (
              <div style={styles.demoTip}>
                <p>💡 <strong>Demo Mode Info:</strong></p>
                <p>Feel free to register a new user, or use the pre-seeded account:</p>
                <p style={styles.demoCredentials}>Email: <code>demo@aimeeting.com</code> | Pass: <code>demo123</code></p>
              </div>
            )}
          </form>

          <div className="auth-switch">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <span onClick={() => { setIsLogin(false); setError(''); }}>Sign Up</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span onClick={() => { setIsLogin(true); setError(''); }}>Sign In</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '30px',
    width: '100%',
    zIndex: 10,
  },
  infoPanel: {
    padding: '60px 50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    textAlign: 'left',
    background: 'rgba(21, 24, 33, 0.4)',
    borderLeftColor: 'rgba(255,255,255,0.03)',
    borderTopColor: 'rgba(255,255,255,0.03)',
  },
  badgeContainer: {
    marginBottom: '24px',
  },
  tag: {
    padding: '6px 14px',
    fontSize: '12px',
  },
  infoTitle: {
    fontFamily: 'var(--font-display)',
    fontSize: '44px',
    lineHeight: '1.15',
    color: '#ffffff',
    marginBottom: '20px',
  },
  highlightText: {
    background: 'linear-gradient(135deg, var(--coral-accent) 0%, var(--violet-accent) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  infoText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: 'var(--text-secondary)',
    marginBottom: '40px',
  },
  featuresList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  featureItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  featureDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: 'var(--coral-accent)',
    marginTop: '6px',
    boxShadow: '0 0 10px var(--coral-accent)',
  },
  featureHeadline: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    display: 'block',
    marginBottom: '2px',
  },
  featureSub: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  formPanel: {
    padding: '50px 40px',
    background: 'rgba(18, 22, 33, 0.85)',
  },
  formHeader: {
    textAlign: 'center',
    marginBottom: '35px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoCircle: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, var(--coral-accent) 0%, var(--violet-accent) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
    boxShadow: '0 0 20px rgba(255, 107, 74, 0.3)',
  },
  logoText: {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    marginBottom: '6px',
  },
  logoSubText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.08)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    padding: '12px 16px',
    borderRadius: '10px',
    color: '#fca5a5',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '24px',
    textAlign: 'left',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
  },
  submitBtn: {
    width: '100%',
    justifyContent: 'center',
    marginTop: '10px',
    padding: '14px',
    fontSize: '16px',
  },
  demoTip: {
    marginTop: '24px',
    background: 'rgba(245, 158, 11, 0.05)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
    textAlign: 'left',
  },
  demoCredentials: {
    marginTop: '4px',
    color: 'var(--amber-accent)',
  },
  glowOrb1: {
    position: 'absolute',
    top: '-20%',
    left: '-20%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-20%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(255, 107, 74, 0.08) 0%, transparent 70%)',
    zIndex: 1,
    pointerEvents: 'none',
  },
};
