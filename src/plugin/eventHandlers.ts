/**
 * Modulo eventi puro di StratumHeatmap.
 *
 * Qui vive tutta la logica di cross-filtering 1D/2D, estratta da `transformProps.ts`
 * (risoluzione dell'`activeCell` dallo stato Superset e handler `onCellClick`) e da
 * `components/StratumHeatmap.tsx` (derivazione delle clausole di filtro al click su una
 * cella, con toggle di deselezione). Nessuna funzione di questo modulo ha effetti
 * collaterali: l'unico punto di contatto con Superset e' il callback `setDataMask`
 * fornito dall'esterno a `createCellClickHandler`.
 */

export interface CrossFilterClause {
  col: string;
  op: 'IN';
  val: string[];
}

export interface CrossFilterActiveCell {
  x: string;
  y: string;
}

export interface CrossFilterCellMeta {
  xValue: string;
  yValue: string;
  isRowTotal?: boolean;
  isColTotal?: boolean;
  isGrandTotal?: boolean;
}

export interface CrossFilterContext {
  xAxisDimension: string;
  yAxisDimension: string;
  totalLabel: string;
}

export interface DataMaskPayload {
  extraFormData: {
    filters: CrossFilterClause[];
  };
  filterState: {
    value: string[] | null;
    activeCell: CrossFilterActiveCell | null;
    filters: CrossFilterClause[];
  };
}

/** Payload di reset: azzera filtri, valore e cella attiva. */
export function buildEmptyDataMaskPayload(): DataMaskPayload {
  return {
    extraFormData: {
      filters: [],
    },
    filterState: {
      value: null,
      activeCell: null,
      filters: [],
    },
  };
}

/**
 * Risolve la cella attiva dallo stato del filtro Superset.
 * Supporta, nell'ordine: `activeCell`, `x`/`y`, `filters` (matchando le due dimensioni)
 * e `value` (coppia [x, y]).
 */
export function resolveActiveCell(
  filterState: unknown,
  xAxisDimension: string,
  yAxisDimension: string,
  totalLabel: string,
): CrossFilterActiveCell | null {
  let activeCell: CrossFilterActiveCell | null = null;
  const fs: any = filterState;
  if (fs) {
    if (fs.activeCell && fs.activeCell.x && fs.activeCell.y) {
      activeCell = fs.activeCell;
    } else if (fs.x && fs.y) {
      activeCell = { x: String(fs.x), y: String(fs.y) };
    } else if (Array.isArray(fs.filters)) {
      const xFilter = fs.filters.find((f: any) => f.col === xAxisDimension);
      const yFilter = fs.filters.find((f: any) => f.col === yAxisDimension);
      if (xFilter?.val?.[0] && yFilter?.val?.[0]) {
        activeCell = { x: String(xFilter.val[0]), y: String(yFilter.val[0]) };
      } else if (xFilter?.val?.[0]) {
        activeCell = { x: String(xFilter.val[0]), y: totalLabel };
      } else if (yFilter?.val?.[0]) {
        activeCell = { x: totalLabel, y: String(yFilter.val[0]) };
      }
    } else if (Array.isArray(fs.value) && fs.value.length >= 2) {
      activeCell = { x: String(fs.value[0]), y: String(fs.value[1]) };
    }
  }
  return activeCell;
}

/**
 * Traduce il click su una cella della matrice nelle clausole di filtro da emettere.
 *
 * - Gran Totale -> array vuoto (reset di tutti i filtri)
 * - Totale di Riga -> filtro 1D sulla sola dimensione Y (o reset se gia' attivo)
 * - Totale di Colonna -> filtro 1D sulla sola dimensione X (o reset se gia' attivo)
 * - Cella ordinaria -> filtro 2D congiunto X+Y (o reset se gia' attiva)
 */
export function buildCellFilterClauses(
  meta: CrossFilterCellMeta | null | undefined,
  activeCell: CrossFilterActiveCell | null | undefined,
  context: CrossFilterContext,
): CrossFilterClause[] {
  if (!meta) return [];

  const { xAxisDimension, yAxisDimension } = context;
  const effectiveTotalLabel = context.totalLabel || 'Totale';

  // Se la cella e' il Gran Totale, resetta tutti i filtri
  if (meta.isGrandTotal) return [];

  // Se e' Totale di Riga: emette filtro unicamente sulla dimensione Y
  if (meta.isRowTotal) {
    if (
      activeCell &&
      activeCell.x === effectiveTotalLabel &&
      String(activeCell.y) === String(meta.yValue)
    ) {
      return [];
    }
    return [{ col: yAxisDimension, op: 'IN', val: [meta.yValue] }];
  }

  // Se e' Totale di Colonna: emette filtro unicamente sulla dimensione X
  if (meta.isColTotal) {
    if (
      activeCell &&
      String(activeCell.x) === String(meta.xValue) &&
      activeCell.y === effectiveTotalLabel
    ) {
      return [];
    }
    return [{ col: xAxisDimension, op: 'IN', val: [meta.xValue] }];
  }

  // Cella ordinaria: reset se gia' attiva, altrimenti filtro congiunto X e Y
  if (
    activeCell &&
    String(activeCell.x) === String(meta.xValue) &&
    String(activeCell.y) === String(meta.yValue)
  ) {
    return [];
  }

  return [
    { col: xAxisDimension, op: 'IN', val: [meta.xValue] },
    { col: yAxisDimension, op: 'IN', val: [meta.yValue] },
  ];
}

/**
 * Calcola il payload di `setDataMask` per un click: reset (toggle off) oppure selezione
 * con la cella attiva risultante (1D o 2D).
 */
export function computeDataMaskPayload(
  filters: CrossFilterClause[],
  activeCell: CrossFilterActiveCell | null | undefined,
  context: CrossFilterContext,
): DataMaskPayload {
  if (!filters || filters.length === 0) {
    return buildEmptyDataMaskPayload();
  }

  const { xAxisDimension, yAxisDimension, totalLabel } = context;
  const clickedX = filters.find(f => f.col === xAxisDimension)?.val[0];
  const clickedY = filters.find(f => f.col === yAxisDimension)?.val[0];

  // Se la cella cliccata e' gia' attiva, deseleziona (toggle off)
  const isSameSingleX = !clickedY && activeCell?.x === clickedX && activeCell?.y === totalLabel;
  const isSameSingleY = !clickedX && activeCell?.y === clickedY && activeCell?.x === totalLabel;
  const isSameDouble =
    activeCell &&
    clickedX !== undefined &&
    clickedY !== undefined &&
    String(activeCell.x) === String(clickedX) &&
    String(activeCell.y) === String(clickedY);

  if (isSameDouble || isSameSingleX || isSameSingleY) {
    return buildEmptyDataMaskPayload();
  }

  const newActiveCell =
    clickedX !== undefined && clickedY !== undefined
      ? { x: clickedX, y: clickedY }
      : clickedX !== undefined
      ? { x: clickedX, y: totalLabel }
      : clickedY !== undefined
      ? { x: totalLabel, y: clickedY }
      : null;

  return {
    extraFormData: {
      filters,
    },
    filterState: {
      value: filters.map(f => f.val[0]),
      activeCell: newActiveCell,
      filters,
    },
  };
}

export interface CellClickHandlerOptions extends CrossFilterContext {
  emitFilter: boolean;
  setDataMask?: ((dataMask: DataMaskPayload) => void) | undefined;
  activeCell?: CrossFilterActiveCell | null;
}

/**
 * Costruisce l'handler `onCellClick` esposto da `transformProps`.
 * Non fa nulla se il filtro e' disabilitato (`emitFilter === false`) o se Superset non
 * fornisce `setDataMask`.
 */
export function createCellClickHandler(
  options: CellClickHandlerOptions,
): (filters: CrossFilterClause[]) => void {
  const { emitFilter, setDataMask, xAxisDimension, yAxisDimension, totalLabel, activeCell } =
    options;

  return (filters: CrossFilterClause[]) => {
    if (!emitFilter || !setDataMask) return;
    setDataMask(
      computeDataMaskPayload(filters, activeCell, {
        xAxisDimension,
        yAxisDimension,
        totalLabel,
      }),
    );
  };
}
