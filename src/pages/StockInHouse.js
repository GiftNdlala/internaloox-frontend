import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, InputGroup, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaExchangeAlt, FaArrowDown, FaArrowUp, FaPlus, FaRedo } from 'react-icons/fa';
import { getMaterials, getStockMovements, createStockMovement } from '../components/api';

const StockInHouse = () => {
  const [materials, setMaterials] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    material_id: '',
    direction: 'in',
    quantity: '',
    unit_cost: '',
    reason: '',
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
      setLoading(true);
    setError(null);
      try {
        const [mats, movs] = await Promise.all([
          getMaterials(),
          getStockMovements()
        ]);
        setMaterials(Array.isArray(mats) ? mats : (mats?.results || []));
        setMovements(Array.isArray(movs) ? movs : (movs?.results || []));
      } catch (e) {
      setError('Failed to load stock data: ' + e.message);
      } finally {
        setLoading(false);
      }
    };

  const validate = useMemo(() => (vals) => {
    const v = {};
    if (!vals.material_id) v.material_id = 'Select a material';
    if (!vals.quantity || Number.isNaN(Number(vals.quantity)) || Number(vals.quantity) <= 0) v.quantity = 'Enter a valid quantity';
    if (vals.direction === 'in' && (vals.unit_cost === '' || Number.isNaN(Number(vals.unit_cost)) || Number(vals.unit_cost) < 0)) v.unit_cost = 'Enter valid unit cost for stock-in';
    if (!vals.reason || vals.reason.trim() === '') v.reason = 'Please provide a reason for this stock movement';
    return v;
  }, []);

  const onChange = (field, value) => {
    // Normalize direction to strict 'in' | 'out' to avoid accidental values
    if (field === 'direction') {
      const normalized = String(value).toLowerCase().trim() === 'in' ? 'in' : 'out';
      setForm((p) => ({ ...p, direction: normalized }));
      setFormErrors((p) => ({ ...p, direction: undefined }));
      return;
    }
    setForm((p) => ({ ...p, [field]: value }));
    setFormErrors((p) => ({ ...p, [field]: undefined }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    
    const errors = validate(form);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSaving(true);
    setFormErrors({});
    
    try {
      const movementData = {
        material: form.material_id,
        movement_type: (form.direction === 'in' ? 'in' : 'out'),
        quantity: parseFloat(form.quantity),
        unit_cost: (form.direction === 'in' ? parseFloat(form.unit_cost) : 0),
        reason: form.reason.trim(),
        note: form.note || ''
      };

      await createStockMovement(movementData);
      
      // Reset form
      setForm({
        material_id: '',
        direction: 'in',
        quantity: '',
        unit_cost: '',
        reason: '',
        note: ''
      });
      
      // Reload data
      await loadData();
      
    } catch (e) {
      setFormErrors({ general: e.message });
    } finally {
      setSaving(false);
    }
  };

  const getMaterialUnit = (id) => materials.find((m) => m.id === id)?.unit || '';

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="py-4">
        <Row className="mb-3">
          <Col className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0">
              <FaExchangeAlt className="me-2 text-primary" />
              Stock In-House Management
            </h4>
            <Button variant="outline-primary" onClick={loadData} disabled={loading}>
              <FaRedo className="me-2" />
              Refresh
                </Button>
          </Col>
        </Row>

        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}

        <Card className="shadow-sm mb-4">
          <Card.Header>
            <h5 className="mb-0">Record Stock Movement</h5>
          </Card.Header>
          <Card.Body>
            {formErrors.general && <Alert variant="danger">{formErrors.general}</Alert>}
            <Form onSubmit={onSave}>
              <Row className="g-3">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Material *</Form.Label>
                    <Form.Select 
                      value={form.material_id} 
                      onChange={(e) => onChange('material_id', e.target.value)} 
                      isInvalid={!!formErrors.material_id}
                    >
                      <option value="">Select material</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.unit}) - Current: {m.current_stock || 0}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.material_id}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Direction</Form.Label>
                    <Form.Select value={form.direction} onChange={(e) => onChange('direction', e.target.value)}>
                      <option value="in">Stock In</option>
                      <option value="out">Stock Out</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Quantity *</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.quantity}
                        onChange={(e) => onChange('quantity', e.target.value)}
                        isInvalid={!!formErrors.quantity}
                        placeholder="0.00"
                      />
                      <InputGroup.Text>{getMaterialUnit(form.material_id)}</InputGroup.Text>
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">{formErrors.quantity}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>Unit Cost {form.direction === 'in' ? '*' : '(Optional)'}</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>R</InputGroup.Text>
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.unit_cost}
                        onChange={(e) => onChange('unit_cost', e.target.value)}
                        isInvalid={!!formErrors.unit_cost}
                        placeholder="0.00"
                        disabled={form.direction === 'out'}
                      />
                    </InputGroup>
                    <Form.Control.Feedback type="invalid">{formErrors.unit_cost}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Reason *</Form.Label>
                    <Form.Control
                      type="text"
                      value={form.reason}
                      onChange={(e) => onChange('reason', e.target.value)}
                      isInvalid={!!formErrors.reason}
                      placeholder="e.g., New stock purchase, Supplier delivery, etc."
                    />
                    <Form.Control.Feedback type="invalid">{formErrors.reason}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-3 mt-2">
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={form.note}
                      onChange={(e) => onChange('note', e.target.value)}
                      placeholder="Optional notes about this stock movement..."
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col>
                  <Button 
                    type="submit" 
                    variant="primary" 
                    disabled={saving}
                    className="me-2"
                  >
                    {saving ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaPlus className="me-2" />
                        Record Movement
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline-secondary"
                    onClick={() => setForm({
                      material_id: '',
                      direction: 'in',
                      quantity: '',
                      unit_cost: '',
                      reason: '',
                      note: ''
                    })}
                  >
                    Clear Form
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">Recent Stock Movements</h5>
          </Card.Header>
          <Card.Body>
            {movements.length === 0 ? (
              <Alert variant="info">No stock movements recorded yet.</Alert>
            ) : (
              <Table responsive striped hover>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Material</th>
                    <th>Direction</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Reason</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.slice(0, 20).map((movement) => (
                    <tr key={movement.id}>
                      <td>{formatDate(movement.created_at)}</td>
                      <td>
                        <strong>{movement.material_name || 'Unknown'}</strong>
                      </td>
                      <td>
                        <Badge bg={movement.direction === 'in' ? 'success' : 'warning'}>
                          {movement.direction === 'in' ? (
                            <><FaArrowDown className="me-1" />In</>
                          ) : (
                            <><FaArrowUp className="me-1" />Out</>
                          )}
                        </Badge>
                      </td>
                      <td>
                        {movement.quantity} {movement.material_unit || 'units'}
                      </td>
                      <td>
                        {movement.unit_cost ? `R${parseFloat(movement.unit_cost).toFixed(2)}` : '-'}
                      </td>
                      <td>
                        {movement.unit_cost ? `R${(parseFloat(movement.quantity) * parseFloat(movement.unit_cost)).toFixed(2)}` : '-'}
                      </td>
                      <td>
                        <small className="text-muted">
                          {movement.reason || '-'}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted">
                          {movement.note || '-'}
                        </small>
                      </td>
                        </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default StockInHouse;