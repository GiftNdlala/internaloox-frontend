import React, { useState } from 'react';
import { Container, Row, Col, Nav, Card, Table, Button } from 'react-bootstrap';
import { FaTruck, FaFileSignature, FaMoneyBillWave, FaMapMarkedAlt } from 'react-icons/fa';

const mockDeliveries = [
  {
    id: 1,
    orderNumber: 'OOX000101',
    customer: 'John Doe',
    address: '160 Jan Smuts Ave, Rosebank, Johannesburg',
    status: 'Ready for Delivery',
    deliveryDate: '2024-07-01',
    depositPaid: 'R50,000',
    balanceDue: 'R100,000',
  },
  {
    id: 2,
    orderNumber: 'OOX000102',
    customer: 'Jane Smith',
    address: 'Sandton City, Sandton, Johannesburg',
    status: 'Ready for Delivery',
    deliveryDate: '2024-07-02',
    depositPaid: 'R80,000',
    balanceDue: 'R120,000',
  },
  {
    id: 3,
    orderNumber: 'OOX000103',
    customer: 'Mike Johnson',
    address: '12 Main Rd, Bryanston, Johannesburg',
    status: 'Ready for Delivery',
    deliveryDate: '2024-07-03',
    depositPaid: 'R60,000',
    balanceDue: 'R90,000',
  },
];

const openGoogleMaps = (address) => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
  window.open(url, '_blank');
};

const DeliveriesTable = () => (
  <Card className="mb-4">
    <Card.Body>
      <Card.Title><FaTruck className="me-2" />Assigned Deliveries</Card.Title>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Address</th>
            <th>Status</th>
            <th>Delivery Date</th>
            <th>Deposit Paid</th>
            <th>Balance Due</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {mockDeliveries.map((delivery) => (
            <tr key={delivery.id}>
              <td>{delivery.orderNumber}</td>
              <td>{delivery.customer}</td>
              <td>{delivery.address}</td>
              <td><span className="badge bg-success">{delivery.status}</span></td>
              <td>{delivery.deliveryDate}</td>
              <td>{delivery.depositPaid}</td>
              <td>{delivery.balanceDue}</td>
              <td>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => openGoogleMaps(delivery.address)}
                >
                  View Route
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card.Body>
  </Card>
);

const ProofOfDeliveryPanel = () => (
  <Card className="mb-4">
    <Card.Body>
      <Card.Title><FaFileSignature className="me-2" />Proof of Delivery</Card.Title>
      <div className="text-muted text-center">(Proof upload and notes coming soon...)</div>
    </Card.Body>
  </Card>
);

const PaymentsPanel = () => (
  <Card className="mb-4">
    <Card.Body>
      <Card.Title><FaMoneyBillWave className="me-2" />Payment Collection</Card.Title>
      <div className="text-muted text-center">(Payment logging coming soon...)</div>
    </Card.Body>
  </Card>
);

const MapPanel = () => (
  <Card className="mb-4">
    <Card.Body>
      <Card.Title><FaMapMarkedAlt className="me-2" />Map & Navigation</Card.Title>
      <div className="mb-3 text-muted">View delivery locations and launch Google Maps navigation.</div>
      <div style={{ width: '100%', height: '400px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <iframe
          title="Google Map"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 0 }}
          src="https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=Sandton+Johannesburg+South+Africa"
          allowFullScreen
        ></iframe>
      </div>
      <div className="mt-4">
        <DeliveriesTable />
      </div>
    </Card.Body>
  </Card>
);

const DeliveryDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('deliveries');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'deliveries':
        return <DeliveriesTable />;
      case 'proof':
        return <ProofOfDeliveryPanel />;
      case 'payments':
        return <PaymentsPanel />;
      case 'map':
        return <MapPanel />;
      default:
        return null;
    }
  };

  return (
    <Container fluid className="mt-4">
      <h2 className="mb-4">Delivery Dashboard</h2>
      <Row>
        <Col md={2} className="mb-3">
          <Nav variant="pills" className="flex-column" activeKey={activeTab} onSelect={setActiveTab}>
            <Nav.Item>
              <Nav.Link eventKey="deliveries" className="d-flex align-items-center">
                <FaTruck className="me-2" /> Deliveries
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="proof" className="d-flex align-items-center">
                <FaFileSignature className="me-2" /> Proof of Delivery
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="payments" className="d-flex align-items-center">
                <FaMoneyBillWave className="me-2" /> Payments
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="map" className="d-flex align-items-center">
                <FaMapMarkedAlt className="me-2" /> Map
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col md={10}>{renderTabContent()}</Col>
      </Row>
    </Container>
  );
};

export default DeliveryDashboard; 