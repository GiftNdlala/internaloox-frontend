import React, { useState, useEffect, useCallback } from 'react';
import { getOrder, updateOrder, getProducts, getColors, getFabrics, convertToLaybuy, makeLaybuyPayment, completeLaybuy } from './api';
import { Button, Table, Form, Alert, Row, Col, Card, Badge, Spinner } from 'react-bootstrap';

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
  const [laybuy, setLaybuy] = useState({ deposit: '', amount: '', terms: '60_days' });
  const [processing, setProcessing] = useState(false);

  // Moved fetchData outside useEffect
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(orderId);
      console.log('Order data received:', data); // Debug log
      console.log('Order items:', data.items); // Debug log
      
      setOrder(data);
      setForm({
        customer: {
          ...(data.customer || {}),
          name: (data.customer && data.customer.name) || data.customer_name || '',
          phone: (data.customer && data.customer.phone) || '',
          email: (data.customer && data.customer.email) || '',
          address: (data.customer && data.customer.address) || ''
        },
        expected_delivery_date: data.expected_delivery_date,
        admin_notes: data.admin_notes,
        deposit_amount: data.deposit_amount,
        payment_status: data.payment_status,
        order_status: data.order_status,
        total_amount: data.total_amount,
        balance_amount: data.balance_amount,
        items: data.items ? data.items.map(item => ({ ...item })) : [],
      });
    } catch (e) {
      console.error('Error fetching order:', e); // Debug log
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchData();
    getProducts().then((data) => setProducts((data && (data.results || data)) || []));
    getColors().then((data) => setColors((data && (data.results || data)) || []));
    getFabrics().then((data) => setFabrics((data && (data.results || data)) || []));
  }, [fetchData]);

  const handleEdit = () => {
    console.log('Form state when editing:', form); // Debug log
    console.log('Form items:', form?.items); // Debug log
    setEditMode(true);
  };
  const handleCancel = () => {
    setEditMode(false);
    setForm({
      customer: {
        ...(order.customer || {}),
        name: (order.customer && order.customer.name) || order.customer_name || '',
        phone: (order.customer && order.customer.phone) || '',
        email: (order.customer && order.customer.email) || '',
        address: (order.customer && order.customer.address) || ''
      },
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
      // Prepare the payload with customer data at the top level
      const payload = {
        customer_id: form.customer.id,
        expected_delivery_date: form.expected_delivery_date,
        admin_notes: form.admin_notes,
        deposit_amount: form.deposit_amount,
        payment_status: form.payment_status,
        order_status: form.order_status,
        total_amount: form.total_amount,
        balance_amount: form.balance_amount,
        customer_update: {
          id: form.customer.id,
          name: form.customer.name,
          phone: form.customer.phone,
          email: form.customer.email,
          address: form.customer.address,
        }, // Include full customer object for backend processing
        customer_data: {
          id: form.customer.id,
          name: form.customer.name,
          phone: form.customer.phone,
          email: form.customer.email,
          address: form.customer.address,
        }, // Alternative field name
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
      console.log('Saving order with payload:', payload); // Debug log
      console.log('Customer data being sent:', payload.customer_update); // Debug log
      console.log('Full payload keys:', Object.keys(payload)); // Debug log
      await updateOrder(orderId, payload);
      setSuccess('Order updated successfully!');
      setEditMode(false);
      fetchData();
    } catch (e) {
      console.error('Error saving order:', e); // Debug log
      setError('Failed to update order');
    }
  };

  const canConvertToLaybuy = () => {
    return order && !order.is_laybuy && ['deposit_pending','pending','confirmed'].includes(order.order_status);
  };
  const canMakeLaybuyPayment = () => order?.is_laybuy && ['active','overdue'].includes(order?.laybuy_status);
  const canCompleteLaybuy = () => order?.is_laybuy && Number(order?.laybuy_balance) <= 0;

  const handleConvertToLaybuy = async () => {
    setProcessing(true);
    setError(null);
    try {
      await convertToLaybuy(orderId, {
        deposit_amount: Number(laybuy.deposit) || 0,
        laybuy_terms: laybuy.terms,
        notes: 'Converted from OrderDetail'
      });
      setSuccess('Order converted to lay-buy');
      fetchData();
    } catch (e) {
      setError(e?.message || 'Failed to convert to lay-buy');
    } finally {
      setProcessing(false);
    }
  };

  const handleLaybuyPayment = async () => {
    setProcessing(true);
    setError(null);
    try {
      const data = { amount: Number(laybuy.amount) || 0 };
      await makeLaybuyPayment(orderId, data);
      setSuccess('Lay-buy payment recorded');
      fetchData();
    } catch (e) {
      setError(e?.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompleteLaybuy = async () => {
    setProcessing(true);
    setError(null);
    try {
      await completeLaybuy(orderId);
      setSuccess('Lay-buy completed and moved to production');
      fetchData();
    } catch (e) {
      setError(e?.message || 'Failed to complete lay-buy');
    } finally {
      setProcessing(false);
    }
  };

  // Keep showing loading until order is fetched; reference lists can load lazily
  if (loading || !order) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '240px' }}>
      <div className="text-center">
        <Spinner animation="border" role="status" />
        <div className="mt-2 text-muted">Loading order...</div>
      </div>
    </div>
  );
  if (error) return <Alert variant="danger">{error}</Alert>;

  return (
    <div className="order-detail">
      <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
        <Button variant="outline-secondary" onClick={onBack}>Back</Button>
        <div className="text-end">
          <div className="h4 mb-1">Order #{order.order_number}</div>
          <div className="d-flex gap-2 justify-content-end flex-wrap">
            <Badge bg="primary" className="text-uppercase">{order.order_status}</Badge>
            {order.payment_status && <Badge bg="warning" text="dark" className="text-uppercase">{order.payment_status}</Badge>}
            {order.is_laybuy && <Badge bg={order.laybuy_status === 'overdue' ? 'danger' : 'info'} className="text-uppercase">Lay-Buy: {order.laybuy_status}</Badge>}
          </div>
        </div>
      </div>
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
                <option value="order_ready">Ready</option>
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
                {form.items && form.items.length > 0 ? (
                  form.items.map((item, idx) => (
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-muted">No products added yet</td>
                  </tr>
                )}
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
          <Row className="g-3">
            <Col md={6}>
              <Card>
                <Card.Header>Customer</Card.Header>
                <Card.Body>
                  <div className="mb-1 fw-semibold">{(order.customer && order.customer.name) || order.customer_name || '—'}</div>
                  <div className="text-muted small">{(order.customer && order.customer.phone) || '—'}</div>
                  <div className="text-muted small">{(order.customer && order.customer.email) || '—'}</div>
                  <div className="text-muted small">{(order.customer && order.customer.address) || '—'}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Header>Order Info</Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between">
                    <div className="text-muted">Expected Delivery</div>
                    <div>{order.expected_delivery_date || '—'}</div>
                  </div>
                  <div className="d-flex justify-content-between mt-2">
                    <div className="text-muted">Status</div>
                    <div><Badge bg="primary" className="text-uppercase">{order.order_status}</Badge></div>
                  </div>
                  {order.admin_notes && (
                    <div className="mt-3">
                      <div className="text-muted">Admin Notes</div>
                      <div>{order.admin_notes}</div>
                    </div>
                  )}

                  {/* Revamp/Repair Info */}
                  {order.order_type && (order.order_type === 'revamp' || order.order_type === 'repair') && (
                    <div className="mt-3">
                      <div className="text-muted">{order.order_type === 'repair' ? 'Repair' : 'Revamp'} Details</div>
                      <div className="fw-semibold">{order.revamp_name || '-'}</div>
                      <div className="small text-muted">Price: R{Number(order.revamp_price || 0).toFixed(2)}</div>
                      {order.revamp_description && (<div className="small mt-1">{order.revamp_description}</div>)}
                      {order.revamp_image && (
                        <div className="mt-2">
                          <img src={order.revamp_image} alt="revamp" style={{ maxWidth: '180px', borderRadius: '8px', border: '1px solid #eee' }} />
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Lay-Buy Actions */}
          <Row className="g-3 mt-3">
            <Col md={12}>
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <span>Lay-Buy Management</span>
                  {order.is_laybuy && (
                    <Badge bg={order.laybuy_status === 'completed' ? 'success' : order.laybuy_status === 'overdue' ? 'danger' : 'warning'}>
                      {order.laybuy_status}
                    </Badge>
                  )}
                </Card.Header>
                <Card.Body>
                  {!order.is_laybuy ? (
                    // Convert to Lay-Buy Section
                    <div>
                      <h6 className="mb-3">Convert to Lay-Buy</h6>
                      <div className="row g-3 align-items-end">
                        <div className="col-md-3">
                          <label className="form-label small text-muted">Deposit Amount (R)</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            className="form-control" 
                            value={laybuy.deposit} 
                            onChange={(e)=>setLaybuy(v=>({...v,deposit:e.target.value}))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label small text-muted">Payment Terms</label>
                          <select className="form-select" value={laybuy.terms} onChange={(e)=>setLaybuy(v=>({...v,terms:e.target.value}))}>
                            <option value="30_days">30 Days</option>
                            <option value="60_days">60 Days</option>
                            <option value="90_days">90 Days</option>
                            <option value="custom">Custom Terms</option>
                          </select>
                        </div>
                        <div className="col-md-3">
                          <button 
                            className="btn btn-primary w-100" 
                            disabled={processing || !laybuy.deposit} 
                            onClick={handleConvertToLaybuy}
                          >
                            {processing ? 'Converting...' : 'Convert to Lay-Buy'}
                          </button>
                        </div>
                        <div className="col-md-3">
                          <div className="small text-muted">
                            Balance: R{(Number(order.balance_amount || 0) - Number(laybuy.deposit || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Lay-Buy Management Section
                    <div>
                      <h6 className="mb-3">Make Payment</h6>
                      <div className="row g-3 align-items-end">
                        <div className="col-md-4">
                          <label className="form-label small text-muted">Payment Amount (R)</label>
                          <input 
                            type="number" 
                            min="0" 
                            step="0.01" 
                            max={order.laybuy_balance || 0}
                            className="form-control" 
                            value={laybuy.amount} 
                            onChange={(e)=>setLaybuy(v=>({...v,amount:e.target.value}))}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="col-md-4">
                          <button 
                            className="btn btn-success w-100" 
                            disabled={processing || !laybuy.amount || Number(laybuy.amount) <= 0} 
                            onClick={handleLaybuyPayment}
                          >
                            {processing ? 'Processing...' : 'Record Payment'}
                          </button>
                        </div>
                        <div className="col-md-4">
                          {canCompleteLaybuy() && (
                            <button 
                              className="btn btn-outline-success w-100" 
                              disabled={processing} 
                              onClick={handleCompleteLaybuy}
                            >
                              Complete Lay-Buy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.is_laybuy && (
                    <div className="mt-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <div className="card bg-light">
                            <div className="card-body p-3">
                              <h6 className="card-title mb-2">Lay-Buy Status</h6>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted">Status:</span>
                                <Badge bg={order.laybuy_status === 'completed' ? 'success' : order.laybuy_status === 'overdue' ? 'danger' : 'warning'}>
                                  {order.laybuy_status}
                                </Badge>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted">Terms:</span>
                                <span className="fw-semibold">{order.laybuy_terms || 'Not set'}</span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Due Date:</span>
                                <span className="fw-semibold">{order.laybuy_due_date || 'Not set'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="card bg-light">
                            <div className="card-body p-3">
                              <h6 className="card-title mb-2">Payment Summary</h6>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted">Total Order:</span>
                                <span className="fw-semibold">R{Number(order.total_amount || 0).toFixed(2)}</span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="text-muted">Payments Made:</span>
                                <span className="text-success fw-semibold">R{Number(order.laybuy_payments_made || 0).toFixed(2)}</span>
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <span className="text-muted">Remaining Balance:</span>
                                <span className="text-danger fw-semibold">R{Number(order.laybuy_balance || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="small text-muted">Payment Progress</span>
                          <span className="small text-muted">
                            {((Number(order.laybuy_payments_made || 0) / Number(order.total_amount || 1)) * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="progress" style={{ height: '8px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ 
                              width: `${(Number(order.laybuy_payments_made || 0) / Number(order.total_amount || 1)) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Days Remaining */}
                      {order.laybuy_due_date && (
                        <div className="mt-2">
                          {(() => {
                            const dueDate = new Date(order.laybuy_due_date);
                            const today = new Date();
                            const daysRemaining = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                            
                            return (
                              <div className={`alert ${daysRemaining < 0 ? 'alert-danger' : daysRemaining <= 7 ? 'alert-warning' : 'alert-info'} py-2`}>
                                <small>
                                  {daysRemaining < 0 
                                    ? `Overdue by ${Math.abs(daysRemaining)} days` 
                                    : daysRemaining === 0 
                                    ? 'Due today' 
                                    : `${daysRemaining} days remaining`
                                  }
                                </small>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Financial Summary */}
          <Row className="g-3 mt-4">
            <Col md={12}>
              <Card>
                <Card.Header>Financial Summary</Card.Header>
                <Card.Body>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Subtotal:</span>
                        <span className="fw-semibold">R{Number(order.total_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Deposit Paid:</span>
                        <span className="text-success fw-semibold">R{Number(order.deposit_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex justify-content-between align-items-center">
                        <span className="text-muted">Balance:</span>
                        <span className="text-danger fw-semibold">R{Number(order.balance_amount || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Show if there were any order-level discounts applied */}
                  {(order.order_discount_percent || order.order_discount_amount) && (
                    <div className="mt-3 p-2 bg-success bg-opacity-10 rounded">
                      <div className="small text-success">
                        <i className="bi bi-check-circle me-1"></i>
                        Order-level discount applied
                        {order.order_discount_percent && ` (${order.order_discount_percent}% off)`}
                        {order.order_discount_amount && ` (Final amount: R${Number(order.order_discount_amount).toFixed(2)})`}
                      </div>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <h5 className="mt-4">Products in Order</h5>
          <Table bordered responsive size="sm" className="align-middle">
            <thead>
              <tr>
                <th>Product</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Color</th>
                <th>Fabric</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, idx) => {
                  const productsList = Array.isArray(products) ? products : (products && products.results) || [];
                  const colorsList = Array.isArray(colors) ? colors : (colors && colors.results) || [];
                  const fabricsList = Array.isArray(fabrics) ? fabrics : (fabrics && fabrics.results) || [];
                  const productName = (productsList.find(p => String(p.id) === String(item.product))?.name) || item.product_name || '—';
                  const colorName = (colorsList.find(c => String(c.id) === String(item.color))?.name) || item.color_name || '';
                  const fabricName = (fabricsList.find(f => String(f.id) === String(item.fabric))?.name) || item.fabric_name || '';
                  // Check if item has discount information (these would be stored in item metadata or calculated)
                  const hasDiscount = item.original_unit_price && item.original_unit_price !== item.unit_price;
                  const totalPrice = parseFloat(item.unit_price) * parseInt(item.quantity);
                  
                  return (
                  <tr key={idx}>
                    <td>{productName}</td>
                    <td>{item.product_description}</td>
                    <td>{item.quantity}</td>
                    <td>
                      {hasDiscount ? (
                        <div>
                          <div className="text-decoration-line-through text-muted small">R{item.original_unit_price}</div>
                          <div className="text-success fw-semibold">R{item.unit_price}</div>
                          <small className="text-success">Discounted</small>
                        </div>
                      ) : (
                        <span>R{item.unit_price}</span>
                      )}
                    </td>
                    <td>
                      <span className="fw-semibold">R{totalPrice.toFixed(2)}</span>
                      {hasDiscount && (
                        <div className="text-muted small">
                          <span className="text-decoration-line-through">R{(parseFloat(item.original_unit_price) * parseInt(item.quantity)).toFixed(2)}</span>
                        </div>
                      )}
                    </td>
                    <td>{colorName}</td>
                    <td>{fabricName}</td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted">No products in this order</td>
                </tr>
              )}
            </tbody>
          </Table>
          <Button variant="primary" onClick={handleEdit}>Edit</Button>
        </>
      )}
    </div>
  );
};

export default OrderDetail; 