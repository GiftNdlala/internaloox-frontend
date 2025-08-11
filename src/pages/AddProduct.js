import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Badge, Spinner } from 'react-bootstrap';
import { FaBoxOpen, FaPalette, FaCouch, FaPlus, FaTrash, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import { createProduct, getColors, getFabrics } from '../components/api';
import SharedHeader from '../components/SharedHeader';

const initialForm = {
  name: '',
  sku: '',
  description: '',
  price: '',
  currency: 'ZAR',
  colors: [], // array of color IDs
  fabrics: [], // array of fabric IDs (optional)
  attributes: {}
};

const AddProduct = ({ user }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [apiError, setApiError] = useState(null);

  const [availableColors, setAvailableColors] = useState([]);
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [colors, fabrics] = await Promise.all([
          getColors().catch(() => ({ results: [] })),
          getFabrics().catch(() => ({ results: [] }))
        ]);
        // Normalize potential response shapes
        const normalize = (data) => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (Array.isArray(data.results)) return data.results;
          return [];
        };
        setAvailableColors(normalize(colors));
        setAvailableFabrics(normalize(fabrics));
      } catch (e) {
        // Fail silently; dropdowns will be empty and allow manual entry
      } finally {
        setLoadingRefs(false);
      }
    };
    loadRefs();
  }, []);

  const validate = useMemo(() => {
    return (values) => {
      const vErrors = {};
      if (!values.name || values.name.trim().length < 2) {
        vErrors.name = 'Product name is required';
      }
      if (values.price === '' || values.price === null) {
        vErrors.price = 'Price in Rands is required';
      } else {
        const numeric = Number(values.price);
        if (Number.isNaN(numeric) || numeric < 0) {
          vErrors.price = 'Enter a valid price (>= 0)';
        }
      }
      if (!Array.isArray(values.colors) || values.colors.length === 0) {
        vErrors.colors = 'Select at least one color';
      }
      // Fabric is optional
      // Attributes: ensure keys are non-empty
      Object.keys(values.attributes || {}).forEach((key) => {
        if (!key || key.trim() === '') {
          vErrors.attributes = 'Attribute names cannot be empty';
        }
      });
      return vErrors;
    };
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };
  const handleMultiSelectChange = (field, event) => {
    const selected = Array.from(event.target.selectedOptions).map(opt => opt.value);
    setForm((prev) => ({ ...prev, [field]: selected }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addCustomField = () => {
    const key = newFieldName.trim();
    if (!key) return;
    setForm((prev) => ({
      ...prev,
      attributes: {
        ...(prev.attributes || {}),
        [key]: newFieldValue
      }
    }));
    setNewFieldName('');
    setNewFieldValue('');
    setErrors((prev) => ({ ...prev, attributes: undefined }));
  };

  const removeCustomField = (key) => {
    setForm((prev) => {
      const nextAttrs = { ...(prev.attributes || {}) };
      delete nextAttrs[key];
      return { ...prev, attributes: nextAttrs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const vErrors = validate(form);
    setErrors(vErrors);
    if (Object.keys(vErrors).filter((k) => vErrors[k]).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku ? form.sku.trim() : undefined,
        description: form.description?.trim() || '',
        price: Number(form.price),
        currency: form.currency || 'ZAR',
        colors: (form.colors || []).map(id => Number(id)),
        fabrics: (form.fabrics || []).map(id => Number(id)),
        attributes: form.attributes || {}
      };
      // Clean undefined
      Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

      const res = await createProduct(payload);
      setSuccess(`Product "${res?.name || payload.name}" created successfully`);
      // Reset form after brief delay
      setTimeout(() => {
        setForm(initialForm);
        const role = user?.role;
        if (role === 'owner') navigate('/owner');
        else if (role === 'admin') navigate('/admin');
        else navigate('/warehouse');
      }, 1000);
    } catch (err) {
      setApiError(err?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  const colorOptions = Array.isArray(availableColors) ? availableColors : [];
  const fabricOptions = Array.isArray(availableFabrics) ? availableFabrics : [];

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <SharedHeader user={user} onLogout={() => navigate('/login')} dashboardType={user?.role === 'owner' ? 'owner' : user?.role || 'warehouse'} />
      <Container className="py-4">
        <Button variant="link" className="mb-3" onClick={() => navigate(-1)}>
          <FaArrowLeft className="me-2" /> Back
        </Button>

        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <Card className="shadow-sm">
              <Card.Header className="d-flex align-items-center">
                <FaBoxOpen className="me-2 text-primary" />
                <h5 className="mb-0">Create New Product</h5>
                <Badge bg="secondary" className="ms-3">Warehouse Manager</Badge>
              </Card.Header>
              <Card.Body>
                {success && (
                  <Alert variant="success" className="d-flex align-items-center">
                    <FaCheckCircle className="me-2" /> {success}
                  </Alert>
                )}
                {apiError && (
                  <Alert variant="danger">{apiError}</Alert>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  <Row className="g-3">
                    <Col md={8}>
                      <Form.Group controlId="name">
                        <Form.Label>Product Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., L-Shaped Couch"
                          value={form.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          isInvalid={!!errors.name}
                          required
                        />
                        <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group controlId="sku">
                        <Form.Label>SKU (optional)</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="e.g., OOX-LC-001"
                          value={form.sku}
                          onChange={(e) => handleChange('sku', e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="price">
                        <Form.Label>Price (Rands)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>R</InputGroup.Text>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={form.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            isInvalid={!!errors.price}
                            required
                          />
                          <InputGroup.Text>ZAR</InputGroup.Text>
                          <Form.Control.Feedback type="invalid">{errors.price}</Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="colors">
                        <Form.Label>Colors (select one or more)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaPalette />
                          </InputGroup.Text>
                          <Form.Select
                            multiple
                            value={form.colors}
                            onChange={(e) => handleMultiSelectChange('colors', e)}
                            isInvalid={!!errors.colors}
                            required
                          >
                            {loadingRefs && <option>Loading...</option>}
                            {!loadingRefs && colorOptions.map((c, idx) => {
                              const value = c?.id ?? c?.name ?? c;
                              const label = c?.name ?? c?.label ?? String(value);
                              return (
                                <option key={`${value}-${idx}`} value={value}>{label}</option>
                              );
                            })}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">{errors.colors}</Form.Control.Feedback>
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group controlId="fabrics">
                        <Form.Label>Fabrics (optional, multiple)</Form.Label>
                        <InputGroup>
                          <InputGroup.Text>
                            <FaCouch />
                          </InputGroup.Text>
                          <Form.Select
                            multiple
                            value={form.fabrics}
                            onChange={(e) => handleMultiSelectChange('fabrics', e)}
                          >
                            {loadingRefs && <option>Loading...</option>}
                            {!loadingRefs && fabricOptions.map((f, idx) => {
                              const value = f?.id ?? f?.name ?? f;
                              const label = f?.name ?? f?.label ?? String(value);
                              return (
                                <option key={`${value}-${idx}`} value={value}>{label}</option>
                              );
                            })}
                          </Form.Select>
                        </InputGroup>
                      </Form.Group>
                    </Col>

                    <Col md={12}>
                      <Form.Group controlId="description">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          placeholder="Short description of the product"
                          value={form.description}
                          onChange={(e) => handleChange('description', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <hr className="my-4" />

                  <div className="d-flex align-items-center mb-2">
                    <h6 className="mb-0">Additional Fields</h6>
                    <Badge bg="info" className="ms-2">Optional</Badge>
                  </div>

                  {errors.attributes && (
                    <Alert variant="warning" className="py-2">{errors.attributes}</Alert>
                  )}

                  {/* Existing custom fields */}
                  {Object.keys(form.attributes || {}).length > 0 && (
                    <div className="mb-3">
                      {Object.entries(form.attributes).map(([key, value]) => (
                        <div key={key} className="d-flex align-items-center mb-2">
                          <div className="me-2" style={{ minWidth: 180 }}>
                            <Badge bg="secondary" className="text-uppercase">{key}</Badge>
                          </div>
                          <Form.Control
                            type="text"
                            value={value}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                attributes: { ...(prev.attributes || {}), [key]: e.target.value }
                              }))
                            }
                          />
                          <Button
                            variant="outline-danger"
                            className="ms-2"
                            onClick={() => removeCustomField(key)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new field controls */}
                  <InputGroup className="mb-3">
                    <Form.Control
                      placeholder="New field name (e.g., Wood Type)"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                    />
                    <Form.Control
                      placeholder="Value"
                      value={newFieldValue}
                      onChange={(e) => setNewFieldValue(e.target.value)}
                    />
                    <Button variant="outline-primary" onClick={addCustomField} disabled={!newFieldName.trim()}>
                      <FaPlus className="me-1" /> Add Field
                    </Button>
                  </InputGroup>

                  <div className="d-flex justify-content-end">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={submitting}
                      className="px-4"
                    >
                      {submitting ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        'Create Product'
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AddProduct;