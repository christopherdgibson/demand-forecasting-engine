import { useState } from 'react';
import { DataGlossary } from '../DataGlossary';
import { SegmentedControl } from '../SegmentedControl';
import { formatNumber, formatPercentage } from '../../utils/numberUtils';

import './styles.css';
import { MODEL_LABELS, MODEL_TYPES, type DataInfo, ErrorStats, ModelMetrics, ModelType } from '../../types';

type MetricWindow = 'burnIn' | 'all';

type MetricsMap = Partial<Record<ModelType, ModelMetrics>>;

interface MetricsProps {
  metricsMap: MetricsMap;
  activeModel: ModelType;
  burnIn: number;
}

const METRIC_KEYS = ['AIC', 'BIC', 'MAPE', 'RMSE'] as const;

type MetricKeys = typeof METRIC_KEYS[number];

const METRIC_DATA_INFO: Record<MetricKeys, DataInfo> = {
  AIC: {
    name: 'Akaike information criterion',
    text: 'How well the model fits the data, with a penalty for each parameter it uses. Lower is better. Only meaningful for comparing models fitted to the same data, and not strictly comparable between ETS and SARIMAX.'
  },
  BIC: {
    name: 'Bayesian information criterion',
    text: 'Like AIC, but it penalises complexity more heavily, so it favours simpler models as the dataset grows. Lower is better.'
  },
  MAPE: {
    name: 'Mean absolute percentage error',
    text: 'The average size of the error as a percentage of the actual value, so it is independent of scale. Periods where the actual value is zero are skipped.'
  },
  RMSE: {
    name: 'Root mean squared error',
    text: 'The typical size of the error in the same units as your data. It penalises large misses more than small ones. Lower is better.'
  }
} as const;

function errorsFor(mm: ModelMetrics | undefined, win: MetricWindow): ErrorStats | undefined {
  return mm?.errors?.[win];
}

// Models sharing the lowest numeric value. Theta (no MAPE) is excluded: its RMSE comes from its own fit.
function bestModels(metricsMap: MetricsMap, win: MetricWindow, key: 'mape' | 'rmse'): Set<ModelType> {
  const comparable = MODEL_TYPES.filter((m) => typeof errorsFor(metricsMap[m], win)?.mape === 'number');
  const values = comparable.map((m) => errorsFor(metricsMap[m], win)?.[key])
    .filter((v): v is number => typeof v === 'number');
  if (values.length < 2) return new Set<ModelType>();
  const min = Math.min(...values);
  return new Set(comparable.filter((m) => errorsFor(metricsMap[m], win)?.[key] === min));
}

export function Metrics({ metricsMap, activeModel, burnIn }: MetricsProps) {
  const [metricWindow, setMetricWindow] = useState<MetricWindow>('burnIn');
  if (Object.keys(metricsMap).length === 0) return null;

  const bestMape = bestModels(metricsMap, metricWindow, 'mape');
  const bestRmse = bestModels(metricsMap, metricWindow, 'rmse');

  return (
    <div className="metrics-container">
      <div className="metrics-header">
        <h2 className="section-heading">Model Fit Metrics</h2>
        <SegmentedControl
          label="Error window"
          legendText="Error window"
          value={metricWindow}
          onChange={setMetricWindow}
          options={[
            { value: 'burnIn', label: 'Excluding initialisation' },
            { value: 'all', label: 'All periods' }
          ]}
        />
      </div>

      <table className="metrics-table">
        <caption>
          {metricWindow === 'burnIn'
            ? `Errors are in-sample, one-step-ahead, excluding the first ${burnIn} periods.`
            : `Errors include the first ${burnIn} periods, which SARIMAX cannot predict meaningfully, so its errors are inflated.`}{' '}
          Lower is better. Theta reports RMSE only.
        </caption>
        <thead>
          <tr>
            <th scope="col">Model</th>
            {METRIC_KEYS.map((h) => (
              <th key={h} scope="col" className="num"><abbr title={METRIC_DATA_INFO[h].name}>{h}</abbr></th>
            ))}
          </tr>
        </thead>
        <tbody>
          {MODEL_TYPES.map((m) => {
            const mm = metricsMap[m];
            const e = errorsFor(mm, metricWindow);
            return (
              <tr key={m} className={m === activeModel ? 'is-active' : undefined}
                  aria-current={m === activeModel ? 'true' : undefined}>
                <th scope="row">{MODEL_LABELS[m]}</th>
                {mm ? (
                  <>
                    <td className="num">{formatNumber(mm.aic) ?? '-'}</td>
                    <td className="num">{formatNumber(mm.bic) ?? '-'}</td>
                    <td className={bestMape.has(m) ? 'num is-best' : 'num'}>
                      {bestMape.has(m) && <span className="best-tag">best</span>}
                      {formatPercentage(e?.mape) ?? '-'}
                    </td>
                    <td className={bestRmse.has(m) ? 'num is-best' : 'num'}>
                      {bestRmse.has(m) && <span className="best-tag">best</span>}
                      {formatNumber(e?.rmse) ?? '-'}
                    </td>
                  </>
                ) : (
                  <td colSpan={4} className="unavailable">unavailable</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      <DataGlossary
        title={"What do these metrics mean?"}
        dataInfo={METRIC_DATA_INFO}
      />
    </div>
  );
}