import React from 'react';
import { Table, Spinner, Button } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

const CustomersTable = ({ customers, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <div className="text-muted mt-2">Loading customers...</div>
      </div>
    );
  }
  if (!customers || customers.length === 0) {
    return (
      <div className="text-center text-muted my-4">No customers found.</div>
    );
  }
  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Phone</th>
          <th>Email</th>
          <th>Address</th>
          <th>Orders</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {customers.map(customer => (
          <tr key={customer.id}>
            <td>{customer.name}</td>
            <td>{customer.phone}</td>
            <td>{customer.email}</td>
            <td>{customer.address}</td>
            <td>{customer.orders_count || 0}</td>
            <td>
              <Button size="sm" variant="outline-secondary" onClick={() => onEdit(customer)} className="me-2">
                <FaEdit />
              </Button>
              <Button size="sm" variant="outline-danger" onClick={() => onDelete(customer)}>
                <FaTrash />
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default CustomersTable; 