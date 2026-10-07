import { describe, it, expect, vi } from 'vitest';
import {
  buildCellFilterClauses,
  buildEmptyDataMaskPayload,
  computeDataMaskPayload,
  createCellClickHandler,
  resolveActiveCell,
  CrossFilterClause,
} from '../src/plugin/eventHandlers';

const context = {
  xAxisDimension: 'GIORNO',
  yAxisDimension: 'ORA',
  totalLabel: 'Totale',
};

const ordinaryMeta = { xValue: 'Lunedì', yValue: '08:00' };
const xClause = (value: string): CrossFilterClause => ({ col: 'GIORNO', op: 'IN', val: [value] });
const yClause = (value: string): CrossFilterClause => ({ col: 'ORA', op: 'IN', val: [value] });

describe('resolveActiveCell', () => {
  it('returns null without a filterState', () => {
    expect(resolveActiveCell(undefined, 'GIORNO', 'ORA', 'Totale')).toBeNull();
    expect(resolveActiveCell(null, 'GIORNO', 'ORA', 'Totale')).toBeNull();
    expect(resolveActiveCell({}, 'GIORNO', 'ORA', 'Totale')).toBeNull();
  });

  it('prefers an explicit activeCell', () => {
    expect(
      resolveActiveCell({ activeCell: { x: 'Lunedì', y: '08:00' } }, 'GIORNO', 'ORA', 'Totale'),
    ).toEqual({ x: 'Lunedì', y: '08:00' });
  });

  it('reads the x/y shorthand', () => {
    expect(resolveActiveCell({ x: 1, y: 2 }, 'GIORNO', 'ORA', 'Totale')).toEqual({
      x: '1',
      y: '2',
    });
  });

  it('derives a 2D active cell from the filters array', () => {
    expect(
      resolveActiveCell({ filters: [xClause('Lunedì'), yClause('08:00')] }, 'GIORNO', 'ORA', 'Totale'),
    ).toEqual({ x: 'Lunedì', y: '08:00' });
  });

  it('derives 1D active cells (row or column total) from the filters array', () => {
    expect(resolveActiveCell({ filters: [xClause('Lunedì')] }, 'GIORNO', 'ORA', 'Totale')).toEqual({
      x: 'Lunedì',
      y: 'Totale',
    });
    expect(resolveActiveCell({ filters: [yClause('08:00')] }, 'GIORNO', 'ORA', 'Totale')).toEqual({
      x: 'Totale',
      y: '08:00',
    });
    expect(resolveActiveCell({ filters: [{ col: 'ALTRO', op: 'IN', val: ['x'] }] }, 'GIORNO', 'ORA', 'Totale')).toBeNull();
  });

  it('reads a [x, y] value pair', () => {
    expect(resolveActiveCell({ value: ['Lunedì', '08:00'] }, 'GIORNO', 'ORA', 'Totale')).toEqual({
      x: 'Lunedì',
      y: '08:00',
    });
    expect(resolveActiveCell({ value: ['solo-x'] }, 'GIORNO', 'ORA', 'Totale')).toBeNull();
  });
});

describe('buildCellFilterClauses', () => {
  it('returns no clauses for a missing meta', () => {
    expect(buildCellFilterClauses(null, null, context)).toEqual([]);
    expect(buildCellFilterClauses(undefined, null, context)).toEqual([]);
  });

  it('emits a 2D cross-filter for an ordinary cell', () => {
    expect(buildCellFilterClauses(ordinaryMeta, null, context)).toEqual([
      xClause('Lunedì'),
      yClause('08:00'),
    ]);
  });

  it('toggles off an already active ordinary cell', () => {
    expect(
      buildCellFilterClauses(ordinaryMeta, { x: 'Lunedì', y: '08:00' }, context),
    ).toEqual([]);
  });

  it('emits a 1D cross-filter for a row total', () => {
    const rowMeta = { xValue: 'Totale', yValue: '08:00', isRowTotal: true };
    expect(buildCellFilterClauses(rowMeta, null, context)).toEqual([yClause('08:00')]);
    expect(buildCellFilterClauses(rowMeta, { x: 'Totale', y: '08:00' }, context)).toEqual([]);
  });

  it('emits a 1D cross-filter for a column total', () => {
    const colMeta = { xValue: 'Lunedì', yValue: 'Totale', isColTotal: true };
    expect(buildCellFilterClauses(colMeta, null, context)).toEqual([xClause('Lunedì')]);
    expect(buildCellFilterClauses(colMeta, { x: 'Lunedì', y: 'Totale' }, context)).toEqual([]);
  });

  it('resets all filters on the grand total cell', () => {
    const grandMeta = { xValue: 'Totale', yValue: 'Totale', isGrandTotal: true };
    expect(buildCellFilterClauses(grandMeta, null, context)).toEqual([]);
    expect(buildCellFilterClauses(grandMeta, { x: 'Lunedì', y: '08:00' }, context)).toEqual([]);
  });

  it('falls back to the default total label when none is provided', () => {
    const rowMeta = { xValue: 'Totale', yValue: '08:00', isRowTotal: true };
    expect(
      buildCellFilterClauses(rowMeta, { x: 'Totale', y: '08:00' }, { ...context, totalLabel: '' }),
    ).toEqual([]);
  });
});

describe('computeDataMaskPayload', () => {
  it('resets the mask for an empty filter list', () => {
    expect(computeDataMaskPayload([], null, context)).toEqual(buildEmptyDataMaskPayload());
  });

  it('builds a 2D selection payload', () => {
    const filters = [xClause('Martedì'), yClause('09:00')];
    expect(computeDataMaskPayload(filters, null, context)).toEqual({
      extraFormData: { filters },
      filterState: {
        value: ['Martedì', '09:00'],
        activeCell: { x: 'Martedì', y: '09:00' },
        filters,
      },
    });
  });

  it('builds a 1D selection payload anchored to the total label', () => {
    expect(computeDataMaskPayload([xClause('Lunedì')], null, context)).toEqual({
      extraFormData: { filters: [xClause('Lunedì')] },
      filterState: {
        value: ['Lunedì'],
        activeCell: { x: 'Lunedì', y: 'Totale' },
        filters: [xClause('Lunedì')],
      },
    });
    expect(computeDataMaskPayload([yClause('08:00')], null, context).filterState.activeCell).toEqual({
      x: 'Totale',
      y: '08:00',
    });
  });

  it('toggles off a 2D selection', () => {
    const filters = [xClause('Martedì'), yClause('09:00')];
    expect(
      computeDataMaskPayload(filters, { x: 'Martedì', y: '09:00' }, context),
    ).toEqual(buildEmptyDataMaskPayload());
  });

  it('toggles off 1D selections', () => {
    expect(
      computeDataMaskPayload([xClause('Lunedì')], { x: 'Lunedì', y: 'Totale' }, context),
    ).toEqual(buildEmptyDataMaskPayload());
    expect(
      computeDataMaskPayload([yClause('08:00')], { x: 'Totale', y: '08:00' }, context),
    ).toEqual(buildEmptyDataMaskPayload());
  });

  it('ignores clauses that match neither dimension', () => {
    const payload = computeDataMaskPayload([{ col: 'ALTRO', op: 'IN', val: ['x'] }], null, context);
    expect(payload.filterState.activeCell).toBeNull();
    expect(payload.filterState.value).toEqual(['x']);
  });
});

describe('createCellClickHandler', () => {
  const options = {
    emitFilter: true,
    xAxisDimension: 'GIORNO',
    yAxisDimension: 'ORA',
    totalLabel: 'Totale',
    activeCell: { x: 'Lunedì', y: '08:00' },
  };

  it('does nothing when filtering is disabled', () => {
    const setDataMask = vi.fn();
    createCellClickHandler({ ...options, emitFilter: false, setDataMask })([xClause('Lunedì')]);
    expect(setDataMask).not.toHaveBeenCalled();
  });

  it('does nothing without a setDataMask hook', () => {
    const handler = createCellClickHandler({ ...options, setDataMask: undefined });
    expect(() => handler([xClause('Lunedì')])).not.toThrow();
  });

  it('forwards the reset payload on toggle off', () => {
    const setDataMask = vi.fn();
    createCellClickHandler({ ...options, setDataMask })([
      xClause('Lunedì'),
      yClause('08:00'),
    ]);
    expect(setDataMask).toHaveBeenCalledWith(buildEmptyDataMaskPayload());
  });

  it('forwards the selection payload for a new cell', () => {
    const setDataMask = vi.fn();
    createCellClickHandler({ ...options, setDataMask })([
      xClause('Martedì'),
      yClause('09:00'),
    ]);
    expect(setDataMask).toHaveBeenCalledWith({
      extraFormData: { filters: [xClause('Martedì'), yClause('09:00')] },
      filterState: {
        value: ['Martedì', '09:00'],
        activeCell: { x: 'Martedì', y: '09:00' },
        filters: [xClause('Martedì'), yClause('09:00')],
      },
    });
  });
});
