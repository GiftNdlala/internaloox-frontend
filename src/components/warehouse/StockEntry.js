import React, { useState, useEffect } from 'react';
import { 
  Modal, Button, Form, Row, Col, Alert, Card,
  Badge, ListGroup, Spinner 
} from 'react-bootstrap';
import { 
  FaBoxes, FaMapMarkerAlt, FaPlus, FaMinus, 
  FaCheck, FaBarcode, FaExclamationTriangle 
} from 'react-icons/fa';
import { 
  getMaterials, quickStockEntry, getStockLocations,
  getMaterialCategories 
} from '../api';

const StockEntry = ({ 
  show, 
  onHide, 
  onStockUpdated 
}) => {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [quantity, setQuantity] = useState('');
  const [location, setLocation] = useState('');
  const [direction, setDirection] = useState('in'); // 'in' or 'out'
  const [reason, setReason] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  // Quick entry mode
  const [quickEntries, setQuickEntries] = useState([]);

  useEffect(() => {
    if (show) {
      loadData();
    }
  }, [show]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [materialsData, locationsData, categoriesData] = await Promise.all([
        getMaterials(),
        getStockLocations(),
        getMaterialCategories()
      ]);

      setMaterials(materialsData);
      setLocations(locationsData);
      setCategories(categoriesData);
    } catch (err) {
      setError('Failed to load stock entry data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addQuickEntry = () => {
    if (!selectedMaterial || !quantity || !location) {
      setError('Please fill in material, quantity, and location');
      return;
    }

    const material = materials.find(m => m.id === parseInt(selectedMaterial));
    const locationName = locations.find(l => l.id === parseInt(location))?.name || location;

    const entry = {
      id: Date.now(),
      material_id: selectedMaterial,
      material_name: material?.name || 'Unknown',
      quantity: parseFloat(quantity),
      location_id: location,
      location_name: locationName,
      movement_type: direction,
      reason,
      batch_number: batchNumber,
      expiry_date: expiryDate,
      notes
    };

    setQuickEntries([...quickEntries, entry]);
    
    // Reset form
    setSelectedMaterial('');
    setQuantity('');
    setLocation('');
    setReason('');
    setBatchNumber('');
    setExpiryDate('');
    setNotes('');
  };

  const removeQuickEntry = (entryId) => {
    setQuickEntries(quickEntries.filter(entry => entry.id !== entryId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (quickEntries.length === 0) {
      setError('Please add at least one stock entry');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const stockData = {
        entries: quickEntries.map(entry => ({
          material_id: entry.material_id,
          quantity: entry.movement_type === 'out' ? -entry.quantity : entry.quantity,
          location_id: entry.location_id,
          location: entry.location_id, // alias for backend location field
          direction: entry.movement_type, // Use direction field for backend serializer
          reason: entry.reason,
          batch_number: entry.batch_number,
          expiry_date: entry.expiry_date,
          notes: entry.notes
        }))
      };

      await quickStockEntry(stockData);
      
      setSuccess(`Successfully processed ${quickEntries.length} stock entries`);
      setQuickEntries([]);
      
      // Notify parent component
      onStockUpdated && onStockUpdated();
      
      setTimeout(() => {
        setSuccess(null);
        onHide();
      }, 2000);
    } catch (err) {
      setError('Failed to process stock entries: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialsByCategory = (categoryId) => {
    return materials.filter(material => material.category_id === categoryId);
  };

  const getStockLevel = (materialId) => {
    const material = materials.find(m => m.id === parseInt(materialId));
    return material?.current_stock || 0;
  };

  const getStockStatus = (materialId) => {
    const material = materials.find(m => m.id === parseInt(materialId));
    if (!material) return 'unknown';
    
    if (material.current_stock <= material.minimum_stock) return 'low';
    if (material.current_stock <= material.minimum_stock * 1.5) return 'medium';
    return 'good';
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'low': return 'danger';
      case 'medium': return 'warning';
      case 'good': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide} 
      size="xl" 
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <FaBoxes className="me-2" />
          Quick Stock Entry
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        {loading && materials.length === 0 ? (
          <div className="text-center p-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading materials...</p>
          </div>
        ) : (
          <>
            {/* Stock Entry Form */}
            <div className="p-4 border-bottom bg-light">
              <h6 className="mb-3">Add Stock Movement</h6>
              
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert variant="success">{success}</Alert>
              )}

              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Material *</Form.Label>
                      <Form.Select
                        value={selectedMaterial}
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        required
                      >
                        <option value="">Select material...</option>
                        {categories.map(category => (
                          <optgroup key={category.id} label={category.name}>
                            {getMaterialsByCategory(category.id).map(material => (
                              <option key={material.id} value={material.id}>
                                {material.name} ({material.unit})
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </Form.Select>
                      {selectedMaterial && (
                        <div className="mt-2">
                          <Badge bg={getStockStatusColor(getStockStatus(selectedMaterial))}>
                            Current Stock: {getStockLevel(selectedMaterial)}
                          </Badge>
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Movement Type *</Form.Label>
                      <Form.Select
                        value={direction}
                        onChange={(e) => setDirection(e.target.value)}
                        required
                      >
                        <option value="in">Stock In (+)</option>
                        <option value="out">Stock Out (-)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={3}>
                    <Form.Group>
                      <Form.Label>Quantity *</Form.Label>
                      <Form.Control
                        type="number"
                        min="0"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>
                        <FaMapMarkerAlt className="me-1" />
                        Location *
                      </Form.Label>
                      <Form.Select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                      >
                        <option value="">Select location...</option>
                        {locations.map(loc => (
                          <option key={loc.id} value={loc.id}>
                            {loc.name} - {loc.description}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Reason *</Form.Label>
                      <Form.Control
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="e.g., New stock purchase, Supplier delivery, etc."
                        required
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>
                        <FaBarcode className="me-1" />
                        Batch Number
                      </Form.Label>
                      <Form.Control
                        type="text"
                        value={batchNumber}
                        onChange={(e) => setBatchNumber(e.target.value)}
                        placeholder="Optional"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Expiry Date</Form.Label>
                      <Form.Control
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Notes</Form.Label>
                      <Form.Control
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Optional notes"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={12}>
                    <Button 
                      variant="success" 
                      onClick={addQuickEntry}
                      disabled={loading || !selectedMaterial || !quantity || !location}
                    >
                      <FaPlus className="me-2" />
                      Add to Entry List
                    </Button>
                  </Col>
                </Row>
              </Form>
            </div>

            {/* Quick Entries List */}
            <div className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Stock Entries to Process ({quickEntries.length})</h6>
                {quickEntries.length > 0 && (
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => setQuickEntries([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {quickEntries.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <FaBoxes size={40} className="mb-3" />
                  <p>No stock entries added yet</p>
                </div>
              ) : (
                <ListGroup>
                  {quickEntries.map(entry => (
                    <ListGroup.Item key={entry.id} className="d-flex justify-content-between align-items-center">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1">{entry.material_name}</h6>
                            <small className="text-muted">
                              <FaMapMarkerAlt className="me-1" />
                              {entry.location_name}
                            </small>
                          </div>
                          <div className="text-end">
                            <Badge bg={entry.movement_type === 'in' ? 'success' : 'warning'}>
                              {entry.movement_type === 'in' ? '+' : '-'}{entry.quantity}
                            </Badge>
                            {entry.reason && (
                              <div>
                                <small className="text-muted">{entry.reason}</small>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {(entry.batch_number || entry.expiry_date || entry.notes) && (
                          <div className="mt-2">
                            {entry.batch_number && (
                              <Badge bg="outline-secondary" className="me-2">
                                Batch: {entry.batch_number}
                              </Badge>
                            )}
                            {entry.expiry_date && (
                              <Badge bg="outline-info" className="me-2">
                                Expires: {new Date(entry.expiry_date).toLocaleDateString()}
                              </Badge>
                            )}
                            {entry.notes && (
                              <small className="text-muted d-block mt-1">
                                Note: {entry.notes}
                              </small>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeQuickEntry(entry.id)}
                        className="ms-3"
                      >
                        <FaMinus />
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          </>
        )}
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSubmit}
          disabled={loading || quickEntries.length === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Processing...
            </>
          ) : (
            <>
              <FaCheck className="me-2" />
              Process {quickEntries.length} Entries
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default StockEntry;