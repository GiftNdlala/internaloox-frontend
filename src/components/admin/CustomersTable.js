import React from 'react';
import { Table } from 'react-bootstrap';

const CustomersTable = () => (
  <Table striped bordered hover responsive>
    <thead>
      <tr>
        <th>Customer Name</th>
        <th>Phone</th>
        <th>Email</th>
        <th>Orders</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td colSpan="5" className="text-center text-muted">(Customer data coming soon...)</td>
      </tr>
    </tbody>
  </Table>
);

export default CustomersTable; 