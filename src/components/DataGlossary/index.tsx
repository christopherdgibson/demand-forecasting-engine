import type { DataInfo } from '../../types';

import './styles.css';

interface DataGlossaryProps<T extends string> {
    title?: string;
    dataInfo: Record<T, DataInfo>
}

export function DataGlossary<T extends string>({title="About these datasets", dataInfo}: DataGlossaryProps<T>) {
    return (
        <details className="glossary">
            <summary>{title}</summary>
            <dl>
                {(Object.keys(dataInfo) as T[]).map((id) => {
                const d = dataInfo[id];
                return (
                    <div key={id}>
                    <dt>
                        {id} <span className="glossary-name">· {d.name}</span>
                    </dt>
                    <dd>
                        {d.frequency && d.unit && <span className="glossary-meta">{d.frequency} · {d.unit}</span>}
                        {d.text}
                    </dd>
                    </div>
                );
                })}
            </dl>
        </details>
    );
}