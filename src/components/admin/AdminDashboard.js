import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Nav, Card, Button, Modal, Form, Alert } from 'react-bootstrap';
import { FaClipboardList, FaMoneyBillWave, FaUsers, FaChartBar, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import OrdersTable from './OrdersTable';
import PaymentsTable from './PaymentsTable';
import CustomersTable from './CustomersTable';
import ReportsTable from './ReportsTable';
import OrderForm from '../OrderForm';
import {
  getOrders, createOrder, updateOrder, deleteOrder,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getPayments, createPayment, updatePayment, deletePayment
} from '../api';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('orders');
  // Data states
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [reports, /* setReports */] = useState([]);
  const [reportsLoading, /* setReportsLoading */] = useState(true);
  // Modal states
  const [showOrderFormModal, setShowOrderFormModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderFormData, setOrderFormData] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ order: '', payment_type: '', amount: '', notes: '' });
  // Error/Success
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('');

  // Fetch data
  useEffect(() => {
    fetchAll();
  }, []);
  const fetchAll = async () => {
    setOrdersLoading(true);
    setCustomersLoading(true);
    setPaymentsLoading(true);
    try {
      const [ordersData, customersData, paymentsData] = await Promise.all([
        getOrders(), getCustomers(), getPayments()
      ]);
      setOrders(ordersData);
      setCustomers(customersData);
      setPayments(paymentsData);
    } catch (e) {
      setError(e.message);
    } finally {
      setOrdersLoading(false);
      setCustomersLoading(false);
      setPaymentsLoading(false);
    }
  };

  // --- Orders CRUD ---
  const openOrderFormModal = (order = null) => {
    if (order) {
      setEditingOrder(order);
      // Map order fields to OrderForm initialData/initialItems
      setOrderFormData({
        customerName: order.customer?.name || '',
        customerPhone: order.customer?.phone || '',
        customerEmail: order.customer?.email || '',
        customerAddress: order.customer?.address || '',
        expectedDeliveryDate: order.expected_delivery_date || '',
        adminNotes: order.admin_notes || '',
        depositAmount: order.deposit_amount || '',
        paymentStatus: order.payment_status || 'deposit_only',
        orderStatus: order.order_status || 'pending',
      });
      setOrderItems(order.items ? order.items.map(item => ({
        productId: item.product,
        productName: item.product_name || '',
        productDescription: item.product_description || '',
        quantity: item.quantity,
        unitPrice: item.unit_price,
        color: item.color || '',
        fabric: item.fabric || '',
      })) : []);
    } else {
      setEditingOrder(null);
      setOrderFormData(null);
      setOrderItems([]);
    }
    setShowOrderFormModal(true);
  };

  const handleOrderFormSubmit = async (payload) => {
    try {
      if (editingOrder) {
        await updateOrder(editingOrder.id, payload);
        setSuccess('Order updated!');
      } else {
        await createOrder(payload);
        setSuccess('Order created!');
      }
      setShowOrderFormModal(false);
      fetchAll();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteOrder = async id => {
    try {
      await deleteOrder(id);
      setSuccess('Order deleted!');
      setDeleteTarget(null);
      fetchAll();
    } catch (e) {
      setError(e.message);
    }
  };

  // --- Customers CRUD ---
  const openCustomerModal = (customer = null) => {
    setEditingCustomer(customer);
    setCustomerForm(customer ? {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address
    } : { name: '', phone: '', email: '', address: '' });
    setShowCustomerModal(true);
  };
  const handleCustomerFormChange = e => {
    const { name, value } = e.target;
    setCustomerForm(f => ({ ...f, [name]: value }));
  };
  const handleCustomerSubmit = async e => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, customerForm);
        setSuccess('Customer updated!');
      } else {
        await createCustomer(customerForm);
        setSuccess('Customer created!');
      }
      setShowCustomerModal(false);
      fetchAll();
    } catch (e) {
      setError(e.message);
    }
  };
  const handleDeleteCustomer = async id => {
    try {
      await deleteCustomer(id);
      setSuccess('Customer deleted!');
      setDeleteTarget(null);
      fetchAll();
    } catch (e) {
      setError(e.message);
    }
  };

  // --- Payments CRUD ---
  const openPaymentModal = (payment = null) => {
    setEditingPayment(payment);
    setPaymentForm(payment ? {
      order: payment.order,
      payment_type: payment.payment_type,
      amount: payment.amount,
      notes: payment.notes
    } : { order: '', payment_type: '', amount: '', notes: '' });
    setShowPaymentModal(true);
  };
  const handlePaymentFormChange = e => {
    const { name, value } = e.target;
    setPaymentForm(f => ({ ...f, [name]: value }));
  };
  const handlePaymentSubmit = async e => {
    e.preventDefault();
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, paymentForm);
        setSuccess('Payment updated!');
      } else {
        await createPayment(paymentForm);
        setSuccess('Payment created!');
      }
      setShowPaymentModal(false);
      fetchAll();
    } catch (e) {
      setError(e.message);
    }
  };
  const handleDeletePayment = async id => {
    try {
      await deletePayment(id);
      setSuccess('Payment deleted!');
      setDeleteTarget(null);
      fetchAll();
    } catch (e) {
      setError(e.message);
    }
  };

  // --- Render Tab Content ---
  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return (
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title><FaClipboardList className="me-2" />Order Management</Card.Title>
                <Button variant="primary" onClick={() => openOrderFormModal()}><FaPlus className="me-2" />Add Order</Button>
              </div>
              <OrdersTable orders={orders} loading={ordersLoading} onEdit={openOrderFormModal} onDelete={order => { setDeleteTarget(order); setDeleteType('order'); }} />
            </Card.Body>
          </Card>
        );
      case 'payments':
        return (
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title><FaMoneyBillWave className="me-2" />Payment Tracking</Card.Title>
                <Button variant="primary" onClick={() => openPaymentModal()}><FaPlus className="me-2" />Add Payment</Button>
              </div>
              <PaymentsTable payments={payments} loading={paymentsLoading} />
              {payments.map(payment => (
                <span key={payment.id} style={{ display: 'none' }}>
                  <Button size="sm" variant="outline-secondary" onClick={() => openPaymentModal(payment)}><FaEdit /></Button>
                  <Button size="sm" variant="outline-danger" onClick={() => { setDeleteTarget(payment); setDeleteType('payment'); }}><FaTrash /></Button>
                </span>
              ))}
            </Card.Body>
          </Card>
        );
      case 'customers':
        return (
          <Card className="mb-4">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title><FaUsers className="me-2" />Customer Management</Card.Title>
                <Button variant="primary" onClick={() => openCustomerModal()}><FaPlus className="me-2" />Add Customer</Button>
              </div>
              <CustomersTable 
                customers={customers} 
                loading={customersLoading} 
                onEdit={openCustomerModal}
                onDelete={(customer) => { setDeleteTarget(customer); setDeleteType('customer'); }}
              />
            </Card.Body>
          </Card>
        );
      case 'reports':
        return (
          <Card className="mb-4">
            <Card.Body>
              <Card.Title><FaChartBar className="me-2" />Basic Reporting</Card.Title>
              <ReportsTable reports={reports} loading={reportsLoading} />
            </Card.Body>
          </Card>
        );
      default:
        return null;
    }
  };

  // --- Render ---
  return (
    <Container fluid className="mt-4">
      {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
      {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
      <Row>
        <Col md={2} className="mb-3">
          <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="orders" className="d-flex align-items-center">
                <FaClipboardList className="me-2" /> Orders
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="payments" className="d-flex align-items-center">
                <FaMoneyBillWave className="me-2" /> Payments
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="customers" className="d-flex align-items-center">
                <FaUsers className="me-2" /> Customers
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="reports" className="d-flex align-items-center">
                <FaChartBar className="me-2" /> Reports
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md={10}>{renderTabContent()}</Col>
      </Row>

      {/* Order Form Modal */}
      <Modal show={showOrderFormModal} onHide={() => setShowOrderFormModal(false)} size="lg" centered>
        <Modal.Body className="p-0">
          <OrderForm
            onClose={() => setShowOrderFormModal(false)}
            onSubmit={handleOrderFormSubmit}
            loading={ordersLoading}
            initialData={orderFormData}
            initialItems={orderItems}
            isEdit={!!editingOrder}
          />
        </Modal.Body>
      </Modal>

      {/* Customer Modal */}
      <Modal show={showCustomerModal} onHide={() => setShowCustomerModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingCustomer ? 'Edit Customer' : 'Add Customer'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleCustomerSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control name="name" value={customerForm.name} onChange={handleCustomerFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control name="phone" value={customerForm.phone} onChange={handleCustomerFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control name="email" type="email" value={customerForm.email} onChange={handleCustomerFormChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control name="address" value={customerForm.address} onChange={handleCustomerFormChange} required />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCustomerModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editingCustomer ? 'Update' : 'Create'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Payment Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editingPayment ? 'Edit Payment' : 'Add Payment'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaymentSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Order</Form.Label>
              <Form.Select name="order" value={paymentForm.order} onChange={handlePaymentFormChange} required>
                <option value="">Select Order</option>
                {orders.map(o => <option key={o.id} value={o.id}>{o.order_number}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Payment Type</Form.Label>
              <Form.Control name="payment_type" value={paymentForm.payment_type} onChange={handlePaymentFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Amount</Form.Label>
              <Form.Control name="amount" type="number" min="0" value={paymentForm.amount} onChange={handlePaymentFormChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control name="notes" value={paymentForm.notes} onChange={handlePaymentFormChange} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit">{editingPayment ? 'Update' : 'Create'}</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal show={!!deleteTarget} onHide={() => setDeleteTarget(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this {deleteType}?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => {
            if (deleteType === 'order') handleDeleteOrder(deleteTarget.id);
            if (deleteType === 'customer') handleDeleteCustomer(deleteTarget.id);
            if (deleteType === 'payment') handleDeletePayment(deleteTarget.id);
          }}>Delete</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard; 