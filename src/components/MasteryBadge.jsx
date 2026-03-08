import { MASTERY_LEVELS } from '../data/lessons';

export default function MasteryBadge({ level }) {
  const ml = MASTERY_LEVELS[level];
  return (
    <span
      className="mastery-badge"
      style={{ color: ml.color, background: ml.bg, border: `1px solid ${ml.color}33` }}
    >
      <span className="dot" style={{ background: ml.color }} />
      {ml.name}
    </span>
  );
}
