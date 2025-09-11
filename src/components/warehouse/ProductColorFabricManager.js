import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Card, Row, Col, Form, Badge, 
  Alert, Spinner, ButtonGroup, OverlayTrigger, 
  Tooltip, Tab, Tabs
} from 'react-bootstrap';
import {
  FaPalette, FaCouch, FaPlus, FaEdit, FaTrash, FaSave, 
  FaTimes, FaPalette as FaColorize, FaLayerGroup,
  FaCheck, FaExclamationTriangle
} from 'react-icons/fa';
import { 
  getColors, getFabrics,
  // Legacy CRUD (kept for editing/deleting non-reference rows)
  updateColor, updateFabric, deleteColor, deleteFabric,
  // Product update
  updateWarehouseProduct,
  // Reference creates (use these for new entries)
  createColorReference, createFabricReference
} from '../api';

const ProductColorFabricManager = ({ 
  show, 
  onHide, 
  product, 
  onProductUpdate, 
  user 
}) => {
  const [activeTab, setActiveTab] = useState('colors');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Colors State
  const [allColors, setAllColors] = useState([]);
  const [productColors, setProductColors] = useState([]);
  const [newColor, setNewColor] = useState({ name: '', code: '', hex_value: '#000000' });
  const [editingColor, setEditingColor] = useState(null);

  // Fabrics State
  const [allFabrics, setAllFabrics] = useState([]);
  const [productFabrics, setProductFabrics] = useState([]);
  const [newFabric, setNewFabric] = useState({ name: '', code: '', description: '' });
  const [editingFabric, setEditingFabric] = useState(null);

  // UI State
  const [showAddColorForm, setShowAddColorForm] = useState(false);
  const [showAddFabricForm, setShowAddFabricForm] = useState(false);

  // Permission check
  const canManage = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role);
  };

  // Load data when modal opens
  useEffect(() => {
    if (show && product) {
      loadAllData();
    }
  }, [show, product]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const [colorsRes, fabricsRes] = await Promise.all([
        getColors().catch(() => ({ results: [] })),
        getFabrics().catch(() => ({ results: [] }))
      ]);

      // Normalize responses from reference endpoints into a frontend-friendly shape
      const normalizeColors = (data) => {
        const items = Array.isArray(data)
          ? data
          : (Array.isArray(data?.results) ? data.results : []);
        return items.map((c) => {
          if (c && (c.color_name || c.color_code)) {
            return {
              id: c.id,
              name: c.color_name,
              code: c.color_code,
              hex_value: c.hex_color,
              is_reference: true,
            };
          }
          // Already normalized/custom color
          return c;
        });
      };

      const normalizeFabrics = (data) => {
        const items = Array.isArray(data)
          ? data
          : (Array.isArray(data?.results) ? data.results : []);
        return items.map((f) => {
          if (f && (f.fabric_name || f.fabric_letter)) {
            return {
              id: f.id,
              name: f.fabric_name,
              code: f.fabric_letter,
              description: f.fabric_type,
              is_reference: true,
            };
          }
          return f;
        });
      };

      setAllColors(normalizeColors(colorsRes));
      setAllFabrics(normalizeFabrics(fabricsRes));
      
      // Set current product colors/fabrics from aliased fields if available
      const assignedColors = (product?.colors || product?.available_colors || []).map((c) => (
        typeof c === 'string' ? { id: null, name: c } : c
      ));
      const assignedFabrics = (product?.fabrics || product?.available_fabrics || []).map((f) => (
        typeof f === 'string' ? { id: null, name: f } : f
      ));
      setProductColors(assignedColors);
      setProductFabrics(assignedFabrics);

    } catch (err) {
      setError('Failed to load colors and fabrics: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Color Management Functions
  const handleAddColor = async () => {
    if (!newColor.name.trim()) {
      setError('Color name is required');
      return;
    }

    try {
      setError('');
      // Create in reference table
      const created = await createColorReference({
        color_name: newColor.name,
        color_code: newColor.code,
        hex_color: newColor.hex_value
      });
      // Normalize to local shape and mark as reference
      const createdColor = {
        id: created?.id,
        name: created?.color_name || newColor.name,
        code: created?.color_code || newColor.code,
        hex_value: created?.hex_color || newColor.hex_value,
        is_reference: true,
      };
      setAllColors([...allColors, createdColor]);
      setNewColor({ name: '', code: '', hex_value: '#000000' });
      setShowAddColorForm(false);
      setSuccess('Color added to reference list successfully!');
    } catch (err) {
      setError('Failed to add color: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleEditColor = async (colorId, updatedData) => {
    try {
      setError('');
      // Only allow editing for custom colors (not reference items)
      const color = allColors.find(c => c.id === colorId);
      if (color?.is_reference) {
        setError('Editing reference colors is not supported here. Create a custom color instead.');
        return;
      }
      const updatedColor = await updateColor(colorId, updatedData);
      setAllColors(allColors.map(c => c.id === colorId ? updatedColor : c));
      setEditingColor(null);
      setSuccess('Color updated successfully!');
    } catch (err) {
      setError('Failed to update color: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDeleteColor = async (colorId) => {
    if (!window.confirm('Are you sure you want to delete this color?')) return;

    try {
      setError('');
      const color = allColors.find(c => c.id === colorId);
      if (color?.is_reference) {
        setError('Deleting reference colors is not supported here.');
        return;
      }
      await deleteColor(colorId);
      setAllColors(allColors.filter(c => c.id !== colorId));
      setProductColors(productColors.filter(c => c.id !== colorId));
      setSuccess('Color deleted successfully!');
    } catch (err) {
      setError('Failed to delete color: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleAddColorToProduct = (color) => {
    if (!productColors.find(pc => pc.id === color.id)) {
      setProductColors([...productColors, color]);
    }
  };

  const handleRemoveColorFromProduct = (colorId) => {
    setProductColors(productColors.filter(pc => pc.id !== colorId));
  };

  // Fabric Management Functions
  const handleAddFabric = async () => {
    if (!newFabric.name.trim()) {
      setError('Fabric name is required');
      return;
    }

    try {
      setError('');
      // Create in reference table
      const created = await createFabricReference({
        fabric_name: newFabric.name,
        fabric_letter: newFabric.code,
        fabric_type: newFabric.description
      });
      // Normalize to local shape and mark as reference
      const createdFabric = {
        id: created?.id,
        name: created?.fabric_name || newFabric.name,
        code: created?.fabric_letter || newFabric.code,
        description: created?.fabric_type || newFabric.description,
        is_reference: true,
      };
      setAllFabrics([...allFabrics, createdFabric]);
      setNewFabric({ name: '', code: '', description: '' });
      setShowAddFabricForm(false);
      setSuccess('Fabric added to reference list successfully!');
    } catch (err) {
      setError('Failed to add fabric: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleEditFabric = async (fabricId, updatedData) => {
    try {
      setError('');
      const fabric = allFabrics.find(f => f.id === fabricId);
      if (fabric?.is_reference) {
        setError('Editing reference fabrics is not supported here. Create a custom fabric instead.');
        return;
      }
      const updatedFabric = await updateFabric(fabricId, updatedData);
      setAllFabrics(allFabrics.map(f => f.id === fabricId ? updatedFabric : f));
      setEditingFabric(null);
      setSuccess('Fabric updated successfully!');
    } catch (err) {
      setError('Failed to update fabric: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDeleteFabric = async (fabricId) => {
    if (!window.confirm('Are you sure you want to delete this fabric?')) return;

    try {
      setError('');
      const fabric = allFabrics.find(f => f.id === fabricId);
      if (fabric?.is_reference) {
        setError('Deleting reference fabrics is not supported here.');
        return;
      }
      await deleteFabric(fabricId);
      setAllFabrics(allFabrics.filter(f => f.id !== fabricId));
      setProductFabrics(productFabrics.filter(f => f.id !== fabricId));
      setSuccess('Fabric deleted successfully!');
    } catch (err) {
      setError('Failed to delete fabric: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleAddFabricToProduct = (fabric) => {
    if (!productFabrics.find(pf => pf.id === fabric.id)) {
      setProductFabrics([...productFabrics, fabric]);
    }
  };

  const handleRemoveFabricFromProduct = (fabricId) => {
    setProductFabrics(productFabrics.filter(pf => pf.id !== fabricId));
  };

  // Save product updates
  const handleSaveProductChanges = async () => {
    try {
      setError('');
      setLoading(true);

      // Prepare the update data using aliased fields (names). Backend maps names to JSON storage.
      const updateData = {
        colors: productColors.map(color => color.name).filter(Boolean),
        fabrics: productFabrics.map(fabric => fabric.name).filter(Boolean),
      };

      await updateWarehouseProduct(product.id, updateData);

      // Update the local product state
      const updatedProduct = {
        ...product,
        colors: productColors.map(c => c.name),
        fabrics: productFabrics.map(f => f.name),
        available_colors: productColors,
        available_fabrics: productFabrics
      };

      onProductUpdate(updatedProduct);
      setSuccess('Product colors and fabrics updated successfully!');
      
      // Close modal after brief delay
      setTimeout(() => {
        onHide();
      }, 1500);

    } catch (err) {
      setError('Failed to update product: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  // Render color management tab
  const renderColorsTab = () => (
    <div>
      {/* Current Product Colors */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaPalette className="me-2" />
            Product Colors ({productColors.length})
          </h6>
          <small className="text-muted">Colors assigned to this product</small>
        </Card.Header>
        <Card.Body>
          {productColors.length === 0 ? (
            <div className="text-center text-muted py-3">
              <FaPalette size={32} className="mb-2" />
              <p>No colors assigned to this product</p>
            </div>
          ) : (
            <Row>
              {productColors.map(color => (
                <Col key={color.id} md={4} className="mb-3">
                  <Card className="border" style={{ borderLeftColor: color.hex_value || '#000', borderLeftWidth: '4px' }}>
                    <Card.Body className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{color.name}</div>
                          {color.code && <small className="text-muted">Code: {color.code}</small>}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: color.hex_value || '#000',
                              border: '1px solid #ddd',
                              borderRadius: '3px'
                            }}
                          />
                          {canManage() && (
                            <Button 
                              size="sm" 
                              variant="outline-danger"
                              onClick={() => handleRemoveColorFromProduct(color.id)}
                            >
                              <FaTimes />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Available Colors */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaColorize className="me-2" />
            All Available Colors ({allColors.length})
          </h6>
          {canManage() && (
            <Button 
              size="sm" 
              variant="primary"
              onClick={() => setShowAddColorForm(!showAddColorForm)}
            >
              <FaPlus className="me-1" />
              Add New Color
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {/* Add Color Form */}
          {showAddColorForm && canManage() && (
            <Card className="mb-3 border-primary">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Color Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={newColor.name}
                        onChange={(e) => setNewColor({...newColor, name: e.target.value})}
                        placeholder="e.g., Royal Blue"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Color Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={newColor.code}
                        onChange={(e) => setNewColor({...newColor, code: e.target.value})}
                        placeholder="e.g., RB001"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Hex Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={newColor.hex_value}
                        onChange={(e) => setNewColor({...newColor, hex_value: e.target.value})}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Label>&nbsp;</Form.Label>
                    <div className="d-flex gap-1">
                      <Button variant="success" onClick={handleAddColor}>
                        <FaCheck />
                      </Button>
                      <Button variant="secondary" onClick={() => setShowAddColorForm(false)}>
                        <FaTimes />
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Colors List */}
          <Row>
            {allColors.map(color => {
              const isAssigned = productColors.find(pc => pc.id === color.id);
              const isEditing = editingColor === color.id;

              return (
                <Col key={color.id} md={6} lg={4} className="mb-3">
                  <Card className={`border ${isAssigned ? 'border-success bg-light' : ''}`}>
                    <Card.Body className="py-2">
                      {isEditing ? (
                        <Form>
                          <Form.Group className="mb-2">
                            <Form.Control
                              size="sm"
                              type="text"
                              defaultValue={color.name}
                              onBlur={(e) => handleEditColor(color.id, { name: e.target.value })}
                            />
                          </Form.Group>
                          <div className="d-flex gap-1">
                            <Button size="sm" variant="success" onClick={() => setEditingColor(null)}>
                              <FaCheck />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingColor(null)}>
                              <FaTimes />
                            </Button>
                          </div>
                        </Form>
                      ) : (
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="fw-bold">{color.name}</div>
                            {color.code && <small className="text-muted">Code: {color.code}</small>}
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <div 
                              style={{
                                width: '20px',
                                height: '20px',
                                backgroundColor: color.hex_value || '#000',
                                border: '1px solid #ddd',
                                borderRadius: '3px'
                              }}
                            />
                            <ButtonGroup size="sm">
                              {!isAssigned && canManage() && (
                                <OverlayTrigger overlay={<Tooltip>Add to Product</Tooltip>}>
                                  <Button 
                                    variant="outline-success"
                                    onClick={() => handleAddColorToProduct(color)}
                                  >
                                    <FaPlus />
                                  </Button>
                                </OverlayTrigger>
                              )}
                              {canManage() && (
                                <>
                                  <OverlayTrigger overlay={<Tooltip>Edit Color</Tooltip>}>
                                    <Button 
                                      variant="outline-warning"
                                      onClick={() => setEditingColor(color.id)}
                                    >
                                      <FaEdit />
                                    </Button>
                                  </OverlayTrigger>
                                  <OverlayTrigger overlay={<Tooltip>Delete Color</Tooltip>}>
                                    <Button 
                                      variant="outline-danger"
                                      onClick={() => handleDeleteColor(color.id)}
                                    >
                                      <FaTrash />
                                    </Button>
                                  </OverlayTrigger>
                                </>
                              )}
                            </ButtonGroup>
                          </div>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {allColors.length === 0 && (
            <div className="text-center text-muted py-4">
              <FaPalette size={48} className="mb-3" />
              <h6>No Colors Available</h6>
              <p>Add the first color to get started</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  // Render fabric management tab
  const renderFabricsTab = () => (
    <div>
      {/* Current Product Fabrics */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaCouch className="me-2" />
            Product Fabrics ({productFabrics.length})
          </h6>
          <small className="text-muted">Fabrics assigned to this product</small>
        </Card.Header>
        <Card.Body>
          {productFabrics.length === 0 ? (
            <div className="text-center text-muted py-3">
              <FaCouch size={32} className="mb-2" />
              <p>No fabrics assigned to this product</p>
            </div>
          ) : (
            <Row>
              {productFabrics.map(fabric => (
                <Col key={fabric.id} md={4} className="mb-3">
                  <Card className="border border-secondary">
                    <Card.Body className="py-2">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-bold">{fabric.name}</div>
                          {fabric.code && <small className="text-muted">Code: {fabric.code}</small>}
                          {fabric.description && (
                            <div className="small text-muted">{fabric.description}</div>
                          )}
                        </div>
                        {canManage() && (
                          <Button 
                            size="sm" 
                            variant="outline-danger"
                            onClick={() => handleRemoveFabricFromProduct(fabric.id)}
                          >
                            <FaTimes />
                          </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Available Fabrics */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0">
            <FaLayerGroup className="me-2" />
            All Available Fabrics ({allFabrics.length})
          </h6>
          {canManage() && (
            <Button 
              size="sm" 
              variant="primary"
              onClick={() => setShowAddFabricForm(!showAddFabricForm)}
            >
              <FaPlus className="me-1" />
              Add New Fabric
            </Button>
          )}
        </Card.Header>
        <Card.Body>
          {/* Add Fabric Form */}
          {showAddFabricForm && canManage() && (
            <Card className="mb-3 border-primary">
              <Card.Body>
                <Row className="g-3">
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Fabric Name *</Form.Label>
                      <Form.Control
                        type="text"
                        value={newFabric.name}
                        onChange={(e) => setNewFabric({...newFabric, name: e.target.value})}
                        placeholder="e.g., Cotton Blend"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Fabric Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={newFabric.code}
                        onChange={(e) => setNewFabric({...newFabric, code: e.target.value})}
                        placeholder="e.g., CB001"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Description</Form.Label>
                      <Form.Control
                        type="text"
                        value={newFabric.description}
                        onChange={(e) => setNewFabric({...newFabric, description: e.target.value})}
                        placeholder="Brief description"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Label>&nbsp;</Form.Label>
                    <div className="d-flex gap-1">
                      <Button variant="success" onClick={handleAddFabric}>
                        <FaCheck />
                      </Button>
                      <Button variant="secondary" onClick={() => setShowAddFabricForm(false)}>
                        <FaTimes />
                      </Button>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Fabrics List */}
          <Row>
            {allFabrics.map(fabric => {
              const isAssigned = productFabrics.find(pf => pf.id === fabric.id);
              const isEditing = editingFabric === fabric.id;

              return (
                <Col key={fabric.id} md={6} lg={4} className="mb-3">
                  <Card className={`border ${isAssigned ? 'border-success bg-light' : ''}`}>
                    <Card.Body className="py-2">
                      {isEditing ? (
                        <Form>
                          <Form.Group className="mb-2">
                            <Form.Control
                              size="sm"
                              type="text"
                              defaultValue={fabric.name}
                              onBlur={(e) => handleEditFabric(fabric.id, { name: e.target.value })}
                            />
                          </Form.Group>
                          <div className="d-flex gap-1">
                            <Button size="sm" variant="success" onClick={() => setEditingFabric(null)}>
                              <FaCheck />
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => setEditingFabric(null)}>
                              <FaTimes />
                            </Button>
                          </div>
                        </Form>
                      ) : (
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <div className="fw-bold">{fabric.name}</div>
                            {fabric.code && <small className="text-muted">Code: {fabric.code}</small>}
                            {fabric.description && (
                              <div className="small text-muted">{fabric.description}</div>
                            )}
                          </div>
                          <ButtonGroup size="sm">
                            {!isAssigned && canManage() && (
                              <OverlayTrigger overlay={<Tooltip>Add to Product</Tooltip>}>
                                <Button 
                                  variant="outline-success"
                                  onClick={() => handleAddFabricToProduct(fabric)}
                                >
                                  <FaPlus />
                                </Button>
                              </OverlayTrigger>
                            )}
                            {canManage() && (
                              <>
                                <OverlayTrigger overlay={<Tooltip>Edit Fabric</Tooltip>}>
                                  <Button 
                                    variant="outline-warning"
                                    onClick={() => setEditingFabric(fabric.id)}
                                  >
                                    <FaEdit />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger overlay={<Tooltip>Delete Fabric</Tooltip>}>
                                  <Button 
                                    variant="outline-danger"
                                    onClick={() => handleDeleteFabric(fabric.id)}
                                  >
                                    <FaTrash />
                                  </Button>
                                </OverlayTrigger>
                              </>
                            )}
                          </ButtonGroup>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {allFabrics.length === 0 && (
            <div className="text-center text-muted py-4">
              <FaCouch size={48} className="mb-3" />
              <h6>No Fabrics Available</h6>
              <p>Add the first fabric to get started</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );

  return (
    <Modal show={show} onHide={onHide} size="xl" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaLayerGroup className="me-2" />
          Manage Colors & Fabrics
          {product && (
            <div className="fs-6 text-muted mt-1">
              Product: {product.name}
            </div>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            <FaExclamationTriangle className="me-2" />
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            <FaCheck className="me-2" />
            {success}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading colors and fabrics...</p>
          </div>
        ) : (
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab eventKey="colors" title={
              <span>
                <FaPalette className="me-2" />
                Colors ({productColors.length})
              </span>
            }>
              {renderColorsTab()}
            </Tab>
            <Tab eventKey="fabrics" title={
              <span>
                <FaCouch className="me-2" />
                Fabrics ({productFabrics.length})
              </span>
            }>
              {renderFabricsTab()}
            </Tab>
          </Tabs>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          <div className="text-muted small">
            {canManage() ? 
              'You can manage colors and fabrics for this product' : 
              'View-only mode - contact your manager to make changes'
            }
          </div>
          <div className="d-flex gap-2">
            <Button variant="secondary" onClick={onHide}>
              Close
            </Button>
            {canManage() && (
              <Button 
                variant="primary" 
                onClick={handleSaveProductChanges}
                disabled={loading}
              >
                <FaSave className="me-1" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default ProductColorFabricManager;