import React from 'react';
import { bandPosition } from '../utils/analysis';
import { formatUSD, formatInt, formatOne, formatPct } from '../utils/format';

/** Marco laboral y sanitario con el que se dimensionó la oferta. */
export function CompliancePanel({ result, projectName }) {
  const { staffingMetrics: staff, yieldMetrics: yieldM, costBreakdown: cb, inputs, unitEconomics, sercopBenchmark: band } = result;
  const position = bandPosition(unitEconomics.unitPricePerM2, band);
  const reliefPct = Math.round((staff.reliefFactor - 1) * 100);

  return (
    <div>
      <div>
        <h3 className="section-title">Marco laboral y sanitario</h3>
        <p className="section-lead">
          Lo que el cálculo da por cumplido en jornada, recargo nocturno y tiempo de contacto del desinfectante.
        </p>
      </div>

      <div className="triple" style={{ marginTop: '1.25rem' }}>
        <div>
          <div className="fact-label">Jornada legal</div>
          <strong>40 h por semana</strong>
          <p>
            Con un factor de relevo de {reliefPct} % para cubrir los descansos obligatorios de 48 h.
          </p>
        </div>
        <div>
          <div className="fact-label">Recargo nocturno, Art. 49</div>
          <strong>25 % adicional</strong>
          <p>
            {staff.nightFTE > 0
              ? `${formatOne(staff.nightFTE)} operarios nocturnos, a ${formatUSD(staff.unitNightLaborCost)} al mes cada uno.`
              : 'Jornada diurna: sin recargo nocturno.'}
          </p>
        </div>
        <div>
          <div className="fact-label">Tiempo de contacto</div>
          <strong>{inputs.disinfectionProtocol.contactTimeMinutes} minutos</strong>
          <p>De referencia según ficha técnica de {inputs.disinfectionProtocol.chemicalProduct}.</p>
        </div>
      </div>

      {staff.coverageFloorApplied && (
        <div className="callout warn" style={{ marginTop: '1.5rem' }}>
          <p>
            <strong>Piso de cobertura aplicado.</strong> Por área el cálculo daba {formatOne(staff.areaBasedFTE)} operarios, pero un
            régimen con presencia continua exige al menos {formatOne(staff.coverageFloorFTE)} para cubrir todas las horas de
            operación.
          </p>
        </div>
      )}

      <div className={`callout ${position.id === 'inside' ? 'good' : position.id === 'near' ? 'warn' : 'bad'}`} style={{ marginTop: '1.5rem' }}>
        <p>
          <strong>Dictamen sobre {projectName}.</strong> La oferta tiene un margen de {formatPct(cb.profit.percentage)} sobre el costo
          modelado e incluye {formatInt(yieldM.monthlyRequiredHours)} horas-hombre mensuales dimensionadas según la norma{' '}
          <em>{inputs.disinfectionProtocol.normative}</em>. Queda{' '}
          {position.id === 'inside' ? 'dentro de' : position.id === 'near' ? 'apenas fuera de' : 'fuera de'} la banda referencial SERCOP de{' '}
          {formatUSD(band.minRateM2)} a {formatUSD(band.maxRateM2)} por m² (CPC {band.cpcCode}).
          {position.id === 'outside' && ' La diferencia debe justificarse, por ejemplo con la cobertura mínima de puestos en áreas pequeñas con operación continua.'}
        </p>
      </div>
    </div>
  );
}
