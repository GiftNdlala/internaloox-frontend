import React from 'react';
import { Table } from 'react-bootstrap';

const PaymentsTable = () => (
  <Table striped bordered hover responsive>
    <thead>
      <tr>
        <th>Payment #</th>
        <th>Order #</th>
        <th>Amount</th>
        <th>Method</th>
        <th>Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colSpan="7" className="text-center text-muted">(Payment data coming soon...)</td>
      </tr>
    </tbody>
  </Table>
);

export default PaymentsTable; 