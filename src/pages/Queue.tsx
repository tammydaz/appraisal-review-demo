import { Link } from 'react-router-dom';
import { QUEUE_ITEMS } from '../lib/sampleAppraisals';
import { fmtDate, usd } from '../lib/format';
import './Queue.css';

export default function Queue() {
  const pending = QUEUE_ITEMS.filter((q) => q.status === 'Pending').length;

  return (
    <div className="queue-page">
      <header className="page-head">
        <div>
          <h1>Appraisal Review Queue</h1>
          <p className="page-sub">
            {pending} pending · UAD 3.6 · Admin pre-fill only
          </p>
        </div>
        <Link to="/review" className="btn btn-secondary">
          + Custom Review
        </Link>
      </header>

      <div className="table-wrap">
        <table className="queue-table">
          <thead>
            <tr>
              <th>Collateral ID</th>
              <th>Property</th>
              <th>Asset Class</th>
              <th>Value</th>
              <th>Effective Date</th>
              <th>Form</th>
              <th>AMC Vendor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {QUEUE_ITEMS.map((item) => (
              <tr key={item.id}>
                <td className="mono">{item.collateralId}</td>
                <td>
                  <div className="addr-main">{item.address}</div>
                  <div className="addr-sub">
                    {item.city}, {item.state}
                  </div>
                </td>
                <td>
                  <span className="asset-badge">{item.assetClass}</span>
                </td>
                <td className="num">{usd(item.appraisedValue)}</td>
                <td>{fmtDate(item.effectiveDate)}</td>
                <td className="form-type">{item.formType}</td>
                <td className="vendor">{item.amcVendor}</td>
                <td>
                  <Link to={`/review/${item.id}`} className="btn btn-sm">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
