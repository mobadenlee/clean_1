import { getTrustClass } from '../../utils/trustCalculator';

/**
 * Circular trust-score indicator with colour-coded border.
 *
 * @param {{ score: number }} props
 */
export default function TrustRing({ score }) {
  return (
    <div className={`trust-ring ${getTrustClass(score)}`}>
      {score}
    </div>
  );
}
