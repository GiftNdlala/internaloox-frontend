import React, { useState, useEffect, useCallback } from 'react';
import { getOrder, updateOrder, getProducts, getColors, getFabrics } from './api';
import { Button, Table, Form, Alert } from 'react-bootstrap';

const OrderDetail = ({ orderId, onBack }) => {
  const [order, setOrder] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(null);
  const [products, setProducts] = useState([]);
  const [colors, setColors] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  // Moved fetchData outside useEffect
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(orderId);
      setOrder(data);
      setForm({
        customer: { ...data.customer },
        expected_delivery_date: data.expected_delivery_date,
        admin_notes: data.admin_notes,
        deposit_amount: data.deposit_amount,
        payment_status: data.payment_status,
        order_status: data.order_status,
        total_amount: data.total_amount,
        balance_amount: data.balance_amount,
        items: data.items.map(item => ({ ...item })),
      });
    } catch (e) {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
    getProducts().then(setProducts);
    getColors().then(setColors);
    getFabrics().then(setFabrics);
  }, [fetchData]);

  const handleEdit = () => setEditMode(true);
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      customer: { ...order.customer },
      expected_delivery_date: order.expected_delivery_date,
      admin_notes: order.admin_notes,
      deposit_amount: order.deposit_amount,
      payment_status: order.payment_status,
      order_status: order.order_status,
      total_amount: order.total_amount,
      balance_amount: order.balance_amount,
      items: order.items.map(item => ({ ...item })),
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, customer: { ...f.customer, [name]: value } }));
  };
  const handleItemChange = (idx, field, value) => {
    setForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item)
    }));
  };
  const handleRemoveItem = (idx) => {
    setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };
  const handleAddItem = () => {
    setForm(f => ({
      ...f,
      items: [...f.items, { product: '', quantity: 1, unit_price: '', color: '', fabric: '', product_description: '' }]
    }));
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        ...form,
        items: form.items.map(item => ({
          id: item.id,
          product: item.product,
          quantity: parseInt(item.quantity),
          unit_price: parseFloat(item.unit_price),
          color: item.color || null,
          fabric: item.fabric || null,
          product_description: item.product_description || '',
        })),
      };
      await updateOrder(orderId, payload);
      setSuccess('Order updated successfully!');
      setEditMode(false);
      fetchData();
    } catch (e) {
      setError('Failed to update order');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!order) return null;

  return (
    <div className="order-detail">
      <Button variant="secondary" onClick={onBack} className="mb-3">Back to Orders</Button>
      <h2>Order #{order.order_number}</h2>
      {success && <Alert variant="success">{success}</Alert>}
      {editMode ? (
        <>
          <h4>Edit Order</h4>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Customer Name</Form.Label>
              <Form.Control name="name" value={form.customer.name} onChange={handleCustomerChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" value={form.customer.phone} onChange={handleCustomerChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" value={form.customer.email} onChange={handleCustomerChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control name="address" value={form.customer.address} onChange={handleCustomerChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Expected Delivery Date</Form.Label>
              <Form.Control type="date" name="expected_delivery_date" value={form.expected_delivery_date} onChange={handleChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Order Status</Form.Label>
              <Form.Select name="order_status" value={form.order_status} onChange={handleChange}>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed (Deposit Paid)</option>
                <option value="in_production">In Production</option>
                <option value="ready_for_delivery">Ready for Delivery</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Admin Notes</Form.Label>
              <Form.Control as="textarea" name="admin_notes" value={form.admin_notes} onChange={handleChange} />
            </Form.Group>
            <h5>Products in Order</h5>
            <Table bordered>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Color</th>
                  <th>Fabric</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <Form.Select value={item.product} onChange={e => handleItemChange(idx, 'product', e.target.value)}>
                        <option value="">Select</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Control value={item.product_description} onChange={e => handleItemChange(idx, 'product_description', e.target.value)} />
                    </td>
                    <td>
                      <Form.Control type="number" min="1" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} />
                    </td>
                    <td>
                      <Form.Control type="number" min="0" value={item.unit_price} onChange={e => handleItemChange(idx, 'unit_price', e.target.value)} />
                    </td>
                    <td>
                      <Form.Select value={item.color || ''} onChange={e => handleItemChange(idx, 'color', e.target.value)}>
                        <option value="">None</option>
                        {colors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </Form.Select>
                    </td>
                    <td>
                      <Form.Select value={item.fabric || ''} onChange={e => handleItemChange(idx, 'fabric', e.target.value)}>
                        <option value="">None</option>
                        {fabrics.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </Form.Select>
                    </td>
                    <td>
                      <Button variant="danger" size="sm" onClick={() => handleRemoveItem(idx)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Button variant="outline-primary" onClick={handleAddItem}>Add Product</Button>
            <div className="mt-4">
              <Button variant="secondary" onClick={handleCancel} className="me-2">Cancel</Button>
              <Button variant="primary" onClick={handleSave}>Save Changes</Button>
            </div>
          </Form>
        </>
      ) : (
        <>
          <h4>Order Details</h4>
          <p><strong>Customer:</strong> {order.customer.name} ({order.customer.phone})<br/>{order.customer.email}<br/>{order.customer.address}</p>
          <p><strong>Expected Delivery:</strong> {order.expected_delivery_date}</p>
          <p><strong>Status:</strong> {order.order_status}</p>
          <p><strong>Admin Notes:</strong> {order.admin_notes}</p>
          <h5>Products in Order</h5>
          <Table bordered>
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Color</th>
                <th>Fabric</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{products.find(p => String(p.id) === String(item.product))?.name || item.product_name}</td>
                  <td>{item.product_description}</td>
                  <td>{item.quantity}</td>
                  <td>R{item.unit_price}</td>
                  <td>{colors.find(c => String(c.id) === String(item.color))?.name || ''}</td>
                  <td>{fabrics.find(f => String(f.id) === String(item.fabric))?.name || ''}</td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Button variant="primary" onClick={handleEdit}>Edit</Button>
        </>
      )}
    </div>
  );
};

export default OrderDetail; 