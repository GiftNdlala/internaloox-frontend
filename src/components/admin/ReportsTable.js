import React from 'react';
import { Table } from 'react-bootstrap';

const ReportsTable = () => (
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
      <tr>
        <td colSpan="4" className="text-center text-muted">(Report data coming soon...)</td>
      </tr>
    </tbody>
  </Table>
);

export default ReportsTable; 