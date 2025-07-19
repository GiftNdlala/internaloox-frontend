import React from 'react';
import { Table, Spinner } from 'react-bootstrap';

const PaymentsTable = ({ payments, loading }) => {
  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <div className="text-muted mt-2">Loading payments...</div>
      </div>
    );
  }
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center text-muted my-4">No payments found.</div>
    );
  }
  return (
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
        {payments.map(payment => (
          <tr key={payment.id}>
            <td>{payment.id}</td>
            <td>{payment.order_number || payment.order}</td>
            <td>{payment.amount}</td>
            <td>{payment.payment_method || payment.method}</td>
            <td>{payment.payment_date || payment.date}</td>
            <td>{payment.status || '-'}</td>
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

export default PaymentsTable; 