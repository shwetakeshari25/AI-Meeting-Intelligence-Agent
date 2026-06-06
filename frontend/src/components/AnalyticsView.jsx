import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Sparkles, 
  Lightbulb, 
  AlertCircle 
} from 'lucide-react';

export default function AnalyticsView({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/analytics/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await response.json();
      if (response.ok) setData(resData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  // SVG Pie Chart Generator
  const renderDonutChart = () => {
    if (!data || !data.speakerBalance) return null;
    
    let accumulatedPercentage = 0;
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const center = 80;

    return (
      <svg width="220" height="220" viewBox="0 0 160 160" style={styles.svg}>
        <circle 
          cx={center} 
          cy={center} 
          r={radius} 
          fill="transparent" 
          stroke="rgba(255,255,255,0.02)" 
          strokeWidth="14" 
        />
        {data.speakerBalance.map((speaker, index) => {
          const strokeDashArray = `${(speaker.percentage / 100) * circumference} ${circumference}`;
          const strokeDashOffset = -accumulatedPercentage;
          accumulatedPercentage += (speaker.percentage / 100) * circumference;

          return (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={speaker.color}
              strokeWidth="14"
              strokeDasharray={strokeDashArray}
              strokeDashoffset={strokeDashOffset}
              transform={`rotate(-90 ${center} ${center})`}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          );
        })}
        {/* Center Text */}
        <text x="80" y="78" textAnchor="middle" fill="#ffffff" style={styles.donutCenterVal}>
          {data.stats?.totalMeetings || 0}
        </text>
        <text x="80" y="94" textAnchor="middle" fill="var(--text-secondary)" style={styles.donutCenterLabel}>
          Meetings
        </text>
      </svg>
    );
  };

  // SVG Line Chart Generator for Productivity Score Timeline
  const renderLineChart = () => {
    if (!data || !data.productivityTimeline || data.productivityTimeline.length === 0) {
      return <div style={styles.emptyChart}>No timeline data available.</div>;
    }

    const timeline = data.productivityTimeline;
    const width = 500;
    const height = 180;
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 15;
    const paddingBottom = 25;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    // Map points
    const points = timeline.map((item, index) => {
      const x = paddingLeft + (timeline.length > 1 ? (index / (timeline.length - 1)) * chartWidth : chartWidth / 2);
      const y = paddingTop + chartHeight - ((item.score / 100) * chartHeight);
      return { x, y, score: item.score, title: item.title };
    });

    const pathD = points.length > 0 
      ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
      : '';

    const areaD = points.length > 0 
      ? `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`
      : '';

    return (
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((gridVal) => {
          const y = paddingTop + chartHeight - ((gridVal / 100) * chartHeight);
          return (
            <g key={gridVal}>
              <line 
                x1={paddingLeft} 
                y1={y} 
                x2={width - paddingRight} 
                y2={y} 
                stroke="rgba(255,255,255,0.04)" 
                strokeWidth="1" 
                strokeDasharray="4"
              />
              <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="var(--text-muted)" style={styles.axisLabel}>
                {gridVal}%
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--coral-accent)" stopOpacity="0.2"/>
            <stop offset="100%" stopColor="var(--coral-accent)" stopOpacity="0.0"/>
          </linearGradient>
        </defs>

        {/* Draw Area */}
        {points.length > 1 && (
          <path d={areaD} fill="url(#chartGradient)" />
        )}

        {/* Draw Line */}
        {points.length > 1 && (
          <path d={pathD} fill="none" stroke="var(--coral-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Draw Dots */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="5" fill="var(--bg-secondary)" stroke="var(--coral-accent)" strokeWidth="2" />
            {/* Value tooltip label */}
            <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#ffffff" style={styles.tooltipText}>
              {p.score}%
            </text>
            {/* X Axis Label */}
            <text x={p.x} y={height - 8} textAnchor="middle" fill="var(--text-muted)" style={styles.xAxisLabel}>
              {p.title.length > 12 ? `${p.title.substring(0, 10)}...` : p.title}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div style={styles.container} className="fade-in">
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Meeting Insights</h1>
          <p style={styles.subtitle}>Smart diagnostics and productivity analytics computed by AI.</p>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Analyzing workspace data...</div>
      ) : (
        <div style={styles.grid}>
          {/* Left panel: Charts */}
          <div style={styles.leftCol}>
            {/* Timeline chart */}
            <div style={styles.card} className="glass-panel">
              <h3 style={styles.cardTitle}>
                <TrendingUp size={16} color="var(--coral-accent)" />
                Productivity Trend
              </h3>
              <div style={styles.chartWrapper}>
                {renderLineChart()}
              </div>
            </div>

            {/* Diagnostics and Suggestions */}
            <div style={styles.card} className="glass-panel">
              <h3 style={styles.cardTitle}>
                <Lightbulb size={16} color="var(--amber-accent)" />
                AI Workspace Suggestions
              </h3>
              
              <div style={styles.suggestions}>
                <div style={styles.suggestionItem}>
                  <div style={styles.sugIconWrapper(true)}>
                    <Sparkles size={14} color="var(--emerald-accent)" />
                  </div>
                  <div>
                    <strong style={styles.sugHeadline}>High Meeting Focus</strong>
                    <p style={styles.sugText}>
                      Your average productivity score of {data?.stats?.avgProductivity}% is in the top 10% of teams. 
                      Meetings have clear agendas and lead to actionable items.
                    </p>
                  </div>
                </div>

                <div style={styles.suggestionItem}>
                  <div style={styles.sugIconWrapper(false)}>
                    <AlertCircle size={14} color="var(--amber-accent)" />
                  </div>
                  <div>
                    <strong style={styles.sugHeadline}>Speaking Time Imbalance</strong>
                    <p style={styles.sugText}>
                      Alok Singh dominated 35% of the speaking time in recent meetings. 
                      Encourage silent participants to share ideas to drive inclusivity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Speaker Balance */}
          <div style={styles.rightCol} className="glass-panel">
            <h3 style={styles.cardTitle}>
              <Users size={16} color="var(--violet-accent)" />
              Collaboration Metrics
            </h3>
            
            <div style={styles.donutContainer}>
              {renderDonutChart()}
            </div>

            <div style={styles.legendGrid}>
              {data?.speakerBalance?.map((speaker, idx) => (
                <div key={idx} style={styles.legendItem}>
                  <div style={styles.legendColor(speaker.color)}></div>
                  <div style={styles.legendInfo}>
                    <div style={styles.legendName}>{speaker.name}</div>
                    <div style={styles.legendPct}>{speaker.percentage}% speaking time</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  header: {
    textAlign: 'left',
    marginBottom: '15px',
  },
  title: {
    fontSize: '28px',
    color: '#ffffff',
    marginBottom: '4px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  loading: {
    padding: '60px 0',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1.8fr 1fr',
    gap: '24px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  rightCol: {
    padding: '30px',
    height: '100%',
    textAlign: 'left',
  },
  card: {
    padding: '30px',
    textAlign: 'left',
  },
  cardTitle: {
    fontSize: '16px',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    fontWeight: '600',
  },
  chartWrapper: {
    padding: '10px 0',
  },
  emptyChart: {
    padding: '40px 0',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    textAlign: 'center',
  },
  donutContainer: {
    display: 'flex',
    justifyContent: 'center',
    margin: '15px 0 30px',
  },
  svg: {
    overflow: 'visible',
  },
  donutCenterVal: {
    fontFamily: 'var(--font-display)',
    fontSize: '24px',
    fontWeight: '800',
  },
  donutCenterLabel: {
    fontSize: '10px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  legendGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.01)',
    border: '1px solid rgba(255,255,255,0.02)',
    borderRadius: '10px',
  },
  legendColor: (color) => ({
    width: '12px',
    height: '12px',
    borderRadius: '4px',
    backgroundColor: color,
    boxShadow: `0 0 10px ${color}`,
    flexShrink: 0,
  }),
  legendInfo: {
    flexGrow: 1,
  },
  legendName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
  },
  legendPct: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  axisLabel: {
    fontSize: '9px',
    fontWeight: '500',
  },
  tooltipText: {
    fontSize: '9px',
    fontWeight: '700',
  },
  xAxisLabel: {
    fontSize: '8px',
    fontWeight: '500',
  },
  suggestions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  suggestionItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  sugIconWrapper: (isPositive) => ({
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    background: isPositive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
    border: isPositive ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(245, 158, 11, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }),
  sugHeadline: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    display: 'block',
    marginBottom: '2px',
  },
  sugText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  }
};
