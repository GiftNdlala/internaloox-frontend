import React from 'react';
import { Table } from 'react-bootstrap';

const OrdersTable = () => (
  <Table striped bordered hover responsive>
    <thead>
      <tr>
        <th>Order #</th>
        <th>Customer</th>
        <th>Product</th>
        <th>Status</th>
        <th>Payment</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colSpan="6" className="text-center text-muted">(Order data coming soon...)</td>
      </tr>
    </tbody>
  </Table>
);

export default OrdersTable; 