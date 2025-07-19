import React from 'react';
import { Table, Spinner } from 'react-bootstrap';

const ReportsTable = ({ reports, loading }) => {
  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <div className="text-muted mt-2">Loading reports...</div>
      </div>
    );
  }
  if (!reports || reports.length === 0) {
    return (
      <div className="text-center text-muted my-4">No reports found.</div>
    );
  }
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Report</th>
          <th>Value</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {reports.map(report => (
          <tr key={report.id}>
            <td>{report.name || report.report}</td>
            <td>{report.value}</td>
            <td>{report.date}</td>
            <td>
              {/* Actions will be added here */}
              <span className="text-muted">(Actions)</span>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default ReportsTable; 