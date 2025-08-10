import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Button, Form, Table, InputGroup, Badge, Modal, Alert, Spinner } from 'react-bootstrap';
import { FaBoxes, FaPlus, FaEdit, FaTrash, FaTag, FaRuler, FaDollarSign } from 'react-icons/fa';
import { 
  getMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  getMaterialCategories
} from '../components/api';

const defaultMaterial = {
  name: '',
  category_id: '',
  unit: '',
  unit_price: '',
  minimum_stock: '',
  description: ''
};

const UNITS = ['units', 'metres', 'meters', 'boards', 'rolls', 'kilograms', 'kg', 'litres', 'liters'];

const InventoryManagement = () => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [form, setForm] = useState(defaultMaterial);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [mats, cats] = await Promise.all([
          getMaterials(),
          getMaterialCategories().catch(() => [])
        ]);
        setMaterials(Array.isArray(mats) ? mats : (mats?.results || []));
        setCategories(Array.isArray(cats) ? cats : (cats?.results || []));
      } catch (e) {
        setError('Failed to load materials');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenNew = () => {
    setEditingMaterial(null);
    setForm(defaultMaterial);
    setShowForm(true);
  };

  const handleOpenEdit = (material) => {
    setEditingMaterial(material);
    setForm({
      name: material.name || '',
      category_id: material.category_id || '',
      unit: material.unit || '',
      unit_price: material.unit_price ?? '',
      minimum_stock: material.minimum_stock ?? '',
      description: material.description || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (material) => {
    if (!window.confirm(`Delete material "${material.name}"?`)) return;
    try {
      await deleteMaterial(material.id);
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
    } catch (e) {
      alert('Delete failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const validate = useMemo(() => (vals) => {
    const v = {};
    if (!vals.name?.trim()) v.name = 'Name is required';
    if (!vals.unit?.trim()) v.unit = 'Unit is required';
    if (vals.unit_price === '' || Number.isNaN(Number(vals.unit_price)) || Number(vals.unit_price) < 0) v.unit_price = 'Valid unit price required';
    if (vals.minimum_stock !== '' && (Number.isNaN(Number(vals.minimum_stock)) || Number(vals.minimum_stock) < 0)) v.minimum_stock = 'Minimum stock must be >= 0';
    return v;
  }, []);

  const [formErrors, setFormErrors] = useState({});
  const onChange = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setFormErrors((p) => ({ ...p, [field]: undefined }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSuccess(null);
    const v = validate(form);
    setFormErrors(v);
    if (Object.values(v).filter(Boolean).length) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        unit: form.unit,
        unit_price: Number(form.unit_price),
        minimum_stock: form.minimum_stock === '' ? null : Number(form.minimum_stock),
        description: form.description?.trim() || ''
      };
      let saved;
      if (editingMaterial) {
        saved = await updateMaterial(editingMaterial.id, payload);
        setMaterials((prev) => prev.map((m) => (m.id === editingMaterial.id ? saved : m)));
        setSuccess('Material updated');
      } else {
        saved = await createMaterial(payload);
        setMaterials((prev) => [saved, ...prev]);
        setSuccess('Material created');
      }
      setShowForm(false);
      setEditingMaterial(null);
      setForm(defaultMaterial);
    } catch (e) {
      setFormErrors({ general: e?.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Container className="py-4">
        <Row className="mb-3">
          <Col className="d-flex align-items-center justify-content-between">
            <h4 className="mb-0"><FaBoxes className="me-2 text-primary" />Inventory Materials</h4>
            <Button variant="success" onClick={handleOpenNew}>
              <FaPlus className="me-2" /> Add Material
            </Button>
          </Col>
        </Row>

        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <Card className="shadow-sm">
          <Card.Body>
            {loading ? (
              <div className="text-center py-5"><Spinner animation="border" /></div>
            ) : (
              <Table responsive hover size="sm" className="align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Min Stock</th>
                    <th>Description</th>
                    <th style={{ width: 140 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-muted py-4">No materials</td>
                    </tr>
                  ) : (
                    materials.map((m) => (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{categories.find((c) => c.id === m.category_id)?.name || '-'}</td>
                        <td><Badge bg="secondary">{m.unit}</Badge></td>
                        <td>R {Number(m.unit_price || 0).toFixed(2)}</td>
                        <td>{m.minimum_stock ?? '-'}</td>
                        <td className="text-truncate" style={{ maxWidth: 260 }}>{m.description}</td>
                        <td className="text-end">
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleOpenEdit(m)}>
                            <FaEdit />
                          </Button>
                          <Button variant="outline-danger" size="sm" onClick={() => handleDelete(m)}>
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </Card.Body>
        </Card>

        <Modal show={showForm} onHide={() => setShowForm(false)} backdrop="static" size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{editingMaterial ? 'Edit Material' : 'Add Material'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formErrors.general && <Alert variant="danger">{formErrors.general}</Alert>}
            <Form onSubmit={onSave}>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label><FaTag className="me-2" />Name</Form.Label>
                    <Form.Control value={form.name} onChange={(e) => onChange('name', e.target.value)} isInvalid={!!formErrors.name} />
                    <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Category</Form.Label>
                    <Form.Select value={form.category_id} onChange={(e) => onChange('category_id', e.target.value)}>
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label><FaRuler className="me-2" />Unit</Form.Label>
                    <Form.Select value={form.unit} onChange={(e) => onChange('unit', e.target.value)} isInvalid={!!formErrors.unit}>
                      <option value="">Select unit</option>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{formErrors.unit}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label><FaDollarSign className="me-2" />Unit Price (ZAR)</Form.Label>
                    <InputGroup>
                      <InputGroup.Text>R</InputGroup.Text>
                      <Form.Control type="number" min="0" step="0.01" value={form.unit_price} onChange={(e) => onChange('unit_price', e.target.value)} isInvalid={!!formErrors.unit_price} />
                      <InputGroup.Text>ZAR</InputGroup.Text>
                      <Form.Control.Feedback type="invalid">{formErrors.unit_price}</Form.Control.Feedback>
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group>
                    <Form.Label>Minimum Stock</Form.Label>
                    <Form.Control type="number" min="0" step="0.01" value={form.minimum_stock} onChange={(e) => onChange('minimum_stock', e.target.value)} isInvalid={!!formErrors.minimum_stock} />
                    <Form.Control.Feedback type="invalid">{formErrors.minimum_stock}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" rows={3} value={form.description} onChange={(e) => onChange('description', e.target.value)} />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-4">
                <Button variant="secondary" className="me-2" onClick={() => setShowForm(false)} disabled={saving}>Cancel</Button>
                <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default InventoryManagement;