export interface ShiftCashMovement {
  id: string;
  type: "cash_in" | "cash_out";
  amount: number;
  reason: string;
  createdBy?: string;
  createdAt: string;
}

export interface ZReportData {
  shiftId: string;
  storeName: string;
  addressLines?: string;
  phone?: string;
  tin?: string;
  rcNumber?: string;
  regulatoryLicense?: string;
  paperWidth: "58mm" | "80mm";
  registerName: string;
  cashierName: string;
  startedAt: string;
  endedAt: string;
  totalTransactions: number;
  cashSalesTotal: number;
  cardSalesTotal: number;
  grossSalesTotal: number;
  openingFloat: number;
  cashInTotal: number;
  cashOutTotal: number;
  movements: ShiftCashMovement[];
  expectedCash: number;
  actualCountedCash: number;
  variance: number;
  closingNotes?: string;
}

export function ZReportPreview({
  data,
  onClose,
  onLockTill,
}: {
  data: ZReportData;
  onClose: () => void;
  onLockTill?: () => void;
}) {
  const paperClass = data.paperWidth === "58mm" ? "receipt-paper-58mm" : "receipt-paper-80mm";
  const varianceStatus =
    Math.abs(data.variance) < 0.01 ? "BALANCED" : data.variance > 0 ? "OVERAGE" : "SHORTAGE";

  return (
    <div className="modal-backdrop receipt-backdrop" role="presentation">
      <section className="receipt-modal" role="dialog" aria-modal="true" aria-labelledby="zreport-heading">
        <div className="receipt-actions">
          {onLockTill && (
            <button className="secondary-button lock-till-action" type="button" onClick={onLockTill}>
              Done &amp; Lock Register 🔒
            </button>
          )}
          <button className="secondary-button" type="button" onClick={() => window.print()}>
            Print Z-Report 🖨️
          </button>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <article className={`receipt-paper ${paperClass}`} id="zreport-heading">
          <header className="receipt-store">
            <strong>{data.storeName.toUpperCase()}</strong>
            {data.addressLines && data.addressLines.split("\n").map((line, i) => <span key={i}>{line}</span>)}
            {data.phone && <span>Tel: {data.phone}</span>}
            {data.tin && <span>TIN: {data.tin}</span>}
            {data.regulatoryLicense && <span>Licence: {data.regulatoryLicense}</span>}
          </header>

          <div className="receipt-rule" />
          <div className="zreport-title-banner">
            <h3>END-OF-DAY Z-REPORT</h3>
            <p>DAILY REGISTER RECONCILIATION</p>
          </div>
          <div className="receipt-rule" />

          <div className="receipt-meta">
            <span>Register: <strong>{data.registerName}</strong></span>
            <span>Cashier: <strong>{data.cashierName}</strong></span>
            <span>Shift Opened: {new Date(data.startedAt).toLocaleString("en-NG")}</span>
            <span>Shift Closed: {new Date(data.endedAt).toLocaleString("en-NG")}</span>
          </div>

          <div className="receipt-rule" />
          <h3>SALES REVENUE SUMMARY</h3>
          <div className="receipt-total-line">
            <span>TRANSACTIONS COUNT:</span>
            <strong>{data.totalTransactions}</strong>
          </div>
          <div className="receipt-total-line">
            <span>CASH SALES:</span>
            <strong>₦{data.cashSalesTotal.toFixed(2)}</strong>
          </div>
          <div className="receipt-total-line">
            <span>CARD / POS SALES:</span>
            <strong>₦{data.cardSalesTotal.toFixed(2)}</strong>
          </div>
          <div className="receipt-rule" />
          <div className="receipt-total-line" style={{ fontSize: "12px", fontWeight: "bold" }}>
            <span>GROSS SALES TOTAL:</span>
            <strong>₦{data.grossSalesTotal.toFixed(2)}</strong>
          </div>

          <div className="receipt-rule" />
          <h3>DRAWER RECONCILIATION</h3>
          <div className="receipt-total-line">
            <span>OPENING CASH FLOAT:</span>
            <strong>₦{data.openingFloat.toFixed(2)}</strong>
          </div>
          <div className="receipt-total-line">
            <span>+ CASH SALES:</span>
            <strong>+₦{data.cashSalesTotal.toFixed(2)}</strong>
          </div>
          {data.cashInTotal > 0 && (
            <div className="receipt-total-line">
              <span>+ EXTRA CASH IN:</span>
              <strong>+₦{data.cashInTotal.toFixed(2)}</strong>
            </div>
          )}
          {data.cashOutTotal > 0 && (
            <div className="receipt-total-line">
              <span>- PETTY CASH OUT:</span>
              <strong>-₦{data.cashOutTotal.toFixed(2)}</strong>
            </div>
          )}
          <div className="receipt-rule" />
          <div className="receipt-total-line">
            <span>EXPECTED IN DRAWER:</span>
            <strong>₦{data.expectedCash.toFixed(2)}</strong>
          </div>
          <div className="receipt-total-line" style={{ fontSize: "11px", fontWeight: "bold" }}>
            <span>ACTUAL COUNTED CASH:</span>
            <strong>₦{data.actualCountedCash.toFixed(2)}</strong>
          </div>
          <div className="receipt-rule" />
          <div
            className="receipt-total-line"
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              color: varianceStatus === "BALANCED" ? "#15803d" : varianceStatus === "OVERAGE" ? "#b45309" : "#dc2626",
            }}
          >
            <span>DRAWER VARIANCE:</span>
            <strong>
              {data.variance >= 0 ? "+" : ""}₦{data.variance.toFixed(2)} ({varianceStatus})
            </strong>
          </div>

          {data.movements && data.movements.length > 0 && (
            <>
              <div className="receipt-rule" />
              <h3>DRAWER EXPENSES LOG</h3>
              {data.movements.map((m, idx) => (
                <div key={idx} className="receipt-item">
                  <span>{m.reason} ({m.type === "cash_out" ? "OUT" : "IN"})</span>
                  <strong>₦{m.amount.toFixed(2)}</strong>
                </div>
              ))}
            </>
          )}

          {data.closingNotes && (
            <>
              <div className="receipt-rule" />
              <p className="receipt-note">
                <strong>Shift Notes:</strong> {data.closingNotes}
              </p>
            </>
          )}

          <div className="receipt-rule" />
          <div className="zreport-signature-block">
            <div className="sig-row">
              <span>Cashier Signature:</span>
              <span className="sig-line">______________________</span>
            </div>
            <div className="sig-row">
              <span>Manager Signature:</span>
              <span className="sig-line">______________________</span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}
