import React from 'react';
import { Table, Spinner, Dropdown, ButtonGroup } from 'react-bootstrap';

const OrdersTable = ({ orders, loading, onEdit, onDelete }) => {
  if (loading) {
    return (
      <div className="text-center my-4">
        <Spinner animation="border" variant="primary" />
        <div className="text-muted mt-2">Loading orders...</div>
      </div>
    );
  }
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center text-muted my-4">No orders found.</div>
    );
  }
  return (
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
        {orders.map(order => (
          <tr key={order.id}>
            <td>{order.order_number}</td>
            <td>{order.customer?.name}</td>
            <td>{order.product_name}</td>
            <td>{order.order_status}</td>
            <td>{order.payment_status}</td>
            <td>
              <Dropdown as={ButtonGroup} align="end">
                <Dropdown.Toggle variant="secondary" size="sm" id={`dropdown-actions-${order.id}`}>Actions</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => onEdit(order)}>Edit</Dropdown.Item>
                  <Dropdown.Item onClick={() => onDelete(order)} className="text-danger">Delete</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default OrdersTable; 