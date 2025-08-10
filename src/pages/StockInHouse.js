import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, InputGroup, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaExchangeAlt, FaArrowDown, FaArrowUp, FaPlus } from 'react-icons/fa';
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
    note: ''
  });
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [mats, movs] = await Promise.all([
          getMaterials(),
          getStockMovements()
        ]);
        setMaterials(Array.isArray(mats) ? mats : (mats?.results || []));
        setMovements(Array.isArray(movs) ? movs : (movs?.results || []));
      } catch (e) {
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const validate = useMemo(() => (vals) => {
    const v = {};
    if (!vals.material_id) v.material_id = 'Select a material';
    if (!vals.quantity || Number.isNaN(Number(vals.quantity)) || Number(vals.quantity) <= 0) v.quantity = 'Enter a valid quantity';
    if (vals.direction === 'in' && (vals.unit_cost === '' || Number.isNaN(Number(vals.unit_cost)) || Number(vals.unit_cost) < 0)) v.unit_cost = 'Enter valid unit cost for stock-in';
    return v;
  }, []);

  const onChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setFormErrors((p) => ({ ...p, [field]: undefined }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setFormErrors(v);
    if (Object.values(v).filter(Boolean).length) return;

    setSaving(true);
    try {
      const payload = {
        material: Number(form.material_id),
        direction: form.direction, // 'in' | 'out'
        quantity: Number(form.quantity),
        unit_cost: form.direction === 'in' ? Number(form.unit_cost) : null,
        note: form.note?.trim() || ''
      };
      const saved = await createStockMovement(payload);
      setMovements((prev) => [saved, ...prev]);
      setForm({ material_id: '', direction: 'in', quantity: '', unit_cost: '', note: '' });
    } catch (e) {
      setFormErrors({ general: e?.message || 'Failed to save stock movement' });
    } finally {
      setSaving(false);
    }
  };

  const getMaterialName = (id) => materials.find((m) => m.id === id)?.name || '-';
  const getMaterialUnit = (id) => materials.find((m) => m.id === id)?.unit || '';

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="py-4">
        <Row className="mb-3">
          <Col className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0"><FaExchangeAlt className="me-2 text-primary" />Stock In-House</h4>
          </Col>
        </Row>

        <Card className="shadow-sm mb-4">
          <Card.Header>Record Stock Movement</Card.Header>
          <Card.Body>
            {formErrors.general && <Alert variant="danger">{formErrors.general}</Alert>}
            <Form onSubmit={onSave}>
              <Row className="g-3">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>Material</Form.Label>
                    <Form.Select value={form.material_id} onChange={(e) => onChange('material_id', e.target.value)} isInvalid={!!formErrors.material_id}>
                      <option value="">Select material</option>
                      {materials.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
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
                    <Form.Label>Quantity</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={form.quantity} onChange={(e) => onChange('quantity', e.target.value)} isInvalid={!!formErrors.quantity} />
                    <Form.Control.Feedback type="invalid">{formErrors.quantity}</Form.Control.Feedback>
                    {form.material_id && <div className="small text-muted mt-1">Unit: {getMaterialUnit(Number(form.material_id))}</div>}
                  </Form.Group>
                </Col>
                {form.direction === 'in' && (
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Unit Cost (ZAR)</Form.Label>
                      <InputGroup>
                        <InputGroup.Text>R</InputGroup.Text>
                        <Form.Control type="number" min="0" step="0.01" value={form.unit_cost} onChange={(e) => onChange('unit_cost', e.target.value)} isInvalid={!!formErrors.unit_cost} />
                        <InputGroup.Text>ZAR</InputGroup.Text>
                        <Form.Control.Feedback type="invalid">{formErrors.unit_cost}</Form.Control.Feedback>
                      </InputGroup>
                    </Form.Group>
                  </Col>
                )}
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Note</Form.Label>
                    <Form.Control as="textarea" rows={2} value={form.note} onChange={(e) => onChange('note', e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-3">
                <Button type="submit" variant="primary" disabled={saving}><FaPlus className="me-2" /> Save Movement</Button>
              </div>
            </Form>
          </Card.Body>
        </Card>

        <Card className="shadow-sm">
          <Card.Header>Recent Movements</Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
              <Table responsive hover size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Direction</th>
                    <th>Quantity</th>
                    <th>Unit Cost</th>
                    <th>Total Value</th>
                    <th>Note</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.length === 0 ? (
                    <tr><td colSpan={7} className="text-center text-muted py-4">No movements</td></tr>
                  ) : (
                    movements.map((mv) => {
                      const mid = mv.material_id ?? mv.material;
                      return (
                        <tr key={mv.id}>
                          <td>{getMaterialName(mid)}</td>
                          <td>{mv.direction === 'in' ? <Badge bg="success"><FaArrowDown className="me-1" />In</Badge> : <Badge bg="warning" text="dark"><FaArrowUp className="me-1" />Out</Badge>}</td>
                          <td>{mv.quantity} {getMaterialUnit(mid)}</td>
                          <td>{mv.unit_cost != null ? `R ${Number(mv.unit_cost).toFixed(2)}` : '-'}</td>
                          <td>{mv.unit_cost != null ? `R ${(Number(mv.unit_cost) * Number(mv.quantity)).toFixed(2)}` : '-'}</td>
                          <td className="text-truncate" style={{ maxWidth: 260 }}>{mv.note || '-'}</td>
                          <td>{mv.created_at || '-'}</td>
                        </tr>
                      );
                    })
                  )}
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