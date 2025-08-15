import React, { useEffect, useState, useCallback } from 'react';
import { 
  Button, Card, Form, InputGroup, Table, Spinner, Alert, 
  Modal, Row, Col, Badge, ButtonGroup, OverlayTrigger, 
  Tooltip, Tabs, Tab, Accordion
} from 'react-bootstrap';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  getWarehouseProducts, getColors, getFabrics, createWarehouseProduct, 
  updateWarehouseProduct, deleteWarehouseProduct, getInventoryDashboard 
} from '../components/api';
import { 
  FaPlus, FaSearch, FaEdit, FaTrash, FaEye, FaPalette, 
  FaCouch, FaBoxes, FaLayerGroup, FaCog, FaChartBar,
  FaSync, FaFilter, FaSortAmountDown, FaSortAmountUp,
  FaTag, FaTags
} from 'react-icons/fa';
import ProductColorFabricManager from '../components/warehouse/ProductColorFabricManager';

const WarehouseProducts = () => {
  const navigate = useNavigate();
  const { user, onLogout } = useOutletContext(); // Get user and onLogout from WarehouseLayout context
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('grid');

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showColorFabricModal, setShowColorFabricModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalMode, setModalMode] = useState('view'); // 'view', 'edit', 'create'

  // Color/Fabric management
  const [availableColors, setAvailableColors] = useState([]);
  const [availableFabrics, setAvailableFabrics] = useState([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('');
  const [newFabricName, setNewFabricName] = useState('');
  const [newFabricCode, setNewFabricCode] = useState('');

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    currency: 'ZAR',
    available_colors: [],
    available_fabrics: [],
    attributes: {}
  });

  // Statistics
  const [dashboardStats, setDashboardStats] = useState(null);

  // Permissions check
  const canManageProducts = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse'].includes(user?.role);
  };

  const canViewProducts = () => {
    return ['owner', 'admin', 'warehouse_manager', 'warehouse', 'warehouse_worker'].includes(user?.role);
  };

  // Load all data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [productsResponse, colorsResponse, fabricsResponse, dashResponse] = await Promise.all([
        getWarehouseProducts(),
        getColors().catch(() => ({ results: [] })),
        getFabrics().catch(() => ({ results: [] })),
        getInventoryDashboard().catch(() => null)
      ]);

      // Handle products with pagination
      let allProducts = [];
      const firstProducts = Array.isArray(productsResponse?.results) ? 
        productsResponse.results : (Array.isArray(productsResponse) ? productsResponse : []);
      allProducts = [...firstProducts];

      // Fetch remaining pages if paginated
      let nextUrl = productsResponse?.next;
      const token = localStorage.getItem('oox_token');
      const API_BASE = process.env.REACT_APP_API_BASE || 'https://internaloox-1.onrender.com/api';
      
      while (nextUrl) {
        try {
          const absoluteUrl = nextUrl.startsWith('http') ? nextUrl : `${API_BASE}${nextUrl}`;
          const res = await fetch(absoluteUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) break;
          const page = await res.json();
          const pageProducts = Array.isArray(page?.results) ? page.results : (Array.isArray(page) ? page : []);
          allProducts.push(...pageProducts);
          nextUrl = page?.next || null;
        } catch (err) {
          break;
        }
      }

      setProducts(allProducts);
      setFilteredProducts(allProducts);
      
      // Normalize colors and fabrics
      const normalizeArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (Array.isArray(data.results)) return data.results;
        return [];
      };

      setAvailableColors(normalizeArray(colorsResponse));
      setAvailableFabrics(normalizeArray(fabricsResponse));
      setDashboardStats(dashResponse);

    } catch (err) {
      setError('Failed to load products: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canViewProducts()) {
      loadData();
    } else {
      setError('You do not have permission to view products.');
      setLoading(false);
    }
  }, [loadData, user]);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...products];

    // Search filter
    if (query.trim()) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(product => 
        (product.name || '').toLowerCase().includes(searchTerm) ||
        (product.sku || '').toLowerCase().includes(searchTerm) ||
        (product.description || '').toLowerCase().includes(searchTerm) ||
        (product.available_colors || []).some(color => 
          (color.name || '').toLowerCase().includes(searchTerm)
        ) ||
        (product.available_fabrics || []).some(fabric => 
          (fabric.name || '').toLowerCase().includes(searchTerm)
        )
      );
    }

    // Category filter
    if (filterBy !== 'all') {
      if (filterBy === 'with-colors') {
        filtered = filtered.filter(p => p.available_colors && p.available_colors.length > 0);
      } else if (filterBy === 'with-fabrics') {
        filtered = filtered.filter(p => p.available_fabrics && p.available_fabrics.length > 0);
      } else if (filterBy === 'no-colors') {
        filtered = filtered.filter(p => !p.available_colors || p.available_colors.length === 0);
      } else if (filterBy === 'no-fabrics') {
        filtered = filtered.filter(p => !p.available_fabrics || p.available_fabrics.length === 0);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      
      if (sortBy === 'price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products, query, filterBy, sortBy, sortOrder]);

  // Handle product actions
  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setModalMode('view');
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    if (!canManageProducts()) {
      setError('You do not have permission to edit products.');
      return;
    }
    setSelectedProduct(product);
    setProductForm({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price || '',
      currency: product.currency || 'ZAR',
      available_colors: product.available_colors || [],
      available_fabrics: product.available_fabrics || [],
      attributes: product.attributes || {}
    });
    setModalMode('edit');
    setShowProductModal(true);
  };

  const handleCreateProduct = () => {
    if (!canManageProducts()) {
      setError('You do not have permission to create products.');
      return;
    }
    setSelectedProduct(null);
    setProductForm({
      name: '',
      sku: '',
      description: '',
      price: '',
      currency: 'ZAR',
      available_colors: [],
      available_fabrics: [],
      attributes: {}
    });
    setModalMode('create');
    setShowProductModal(true);
  };

  const handleSaveProduct = async () => {
    try {
      setError('');
      if (modalMode === 'create') {
        await createWarehouseProduct(productForm);
        setSuccess('Product created successfully!');
      } else if (modalMode === 'edit') {
        await updateWarehouseProduct(selectedProduct.id, productForm);
        setSuccess('Product updated successfully!');
      }
      setShowProductModal(false);
      loadData();
    } catch (err) {
      setError('Failed to save product: ' + (err?.message || 'Unknown error'));
    }
  };

  const handleDeleteProduct = async (product) => {
    if (!canManageProducts()) {
      setError('You do not have permission to delete products.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      try {
        await deleteWarehouseProduct(product.id);
        setSuccess('Product deleted successfully!');
        loadData();
      } catch (err) {
        setError('Failed to delete product: ' + (err?.message || 'Unknown error'));
      }
    }
  };

  const handleManageColorsFabrics = (product) => {
    if (!canManageProducts()) {
      setError('You do not have permission to manage colors and fabrics.');
      return;
    }
    setSelectedProduct(product);
    setShowColorFabricModal(true);
  };

  const handleProductUpdate = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setSuccess('Product updated successfully!');
  };

  // Color and Fabric helpers
  const getColorDisplay = (colors) => {
    if (!colors || colors.length === 0) return 'No colors';
    return colors.slice(0, 3).map((color, index) => (
      <Badge key={index} bg="primary" className="me-1">
        {color.name || color}
      </Badge>
    ));
  };

  const getFabricDisplay = (fabrics) => {
    if (!fabrics || fabrics.length === 0) return 'No fabrics';
    return fabrics.slice(0, 3).map((fabric, index) => (
      <Badge key={index} bg="secondary" className="me-1">
        {fabric.name || fabric}
      </Badge>
    ));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount || 0);
  };

  // Render grid view
  const renderGridView = () => (
    <Row>
      {filteredProducts.map(product => (
        <Col key={product.id} lg={4} md={6} className="mb-4">
          <Card className="h-100 shadow-sm product-card" style={{ transition: 'all 0.3s ease' }}>
            <Card.Body className="d-flex flex-column">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="card-title mb-1">{product.name}</h5>
                  <small className="text-muted">SKU: {product.sku || 'N/A'}</small>
                </div>
                <Badge bg="success" className="fs-6">
                  {formatCurrency(product.price)}
                </Badge>
              </div>

              <p className="card-text text-muted mb-3" style={{ 
                height: '60px', 
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical'
              }}>
                {product.description || 'No description available'}
              </p>

              <div className="mb-3">
                <div className="mb-2">
                  <small className="fw-bold">Colors:</small>
                  <div>{getColorDisplay(product.available_colors)}</div>
                </div>
                <div>
                  <small className="fw-bold">Fabrics:</small>
                  <div>{getFabricDisplay(product.available_fabrics)}</div>
                </div>
              </div>

              <div className="mt-auto">
                <ButtonGroup className="w-100">
                  <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                    <Button variant="outline-primary" onClick={() => handleViewProduct(product)}>
                      <FaEye />
                    </Button>
                  </OverlayTrigger>
                  {canManageProducts() && (
                    <>
                      <OverlayTrigger overlay={<Tooltip>Manage Colors & Fabrics</Tooltip>}>
                        <Button variant="outline-info" onClick={() => handleManageColorsFabrics(product)}>
                          <FaPalette />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger overlay={<Tooltip>Edit Product</Tooltip>}>
                        <Button variant="outline-warning" onClick={() => handleEditProduct(product)}>
                          <FaEdit />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger overlay={<Tooltip>Delete Product</Tooltip>}>
                        <Button variant="outline-danger" onClick={() => handleDeleteProduct(product)}>
                          <FaTrash />
                        </Button>
                      </OverlayTrigger>
                    </>
                  )}
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );

  // Render table view
  const renderTableView = () => (
    <Card>
      <Table responsive hover className="mb-0">
        <thead className="table-light">
          <tr>
            <th style={{ cursor: 'pointer' }} onClick={() => {
              setSortBy('name');
              setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
            }}>
              Product Name {sortBy === 'name' && (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
            </th>
            <th>SKU</th>
            <th style={{ cursor: 'pointer' }} onClick={() => {
              setSortBy('price');
              setSortOrder(sortBy === 'price' && sortOrder === 'asc' ? 'desc' : 'asc');
            }}>
              Price {sortBy === 'price' && (sortOrder === 'asc' ? <FaSortAmountUp /> : <FaSortAmountDown />)}
            </th>
            <th>Colors</th>
            <th>Fabrics</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map(product => (
            <tr key={product.id}>
              <td>
                <div>
                  <div className="fw-bold">{product.name}</div>
                  <small className="text-muted">{product.description?.slice(0, 50)}...</small>
                </div>
              </td>
              <td><code>{product.sku || 'N/A'}</code></td>
              <td className="fw-bold text-success">{formatCurrency(product.price)}</td>
              <td>{getColorDisplay(product.available_colors)}</td>
              <td>{getFabricDisplay(product.available_fabrics)}</td>
              <td>
                <ButtonGroup size="sm">
                  <OverlayTrigger overlay={<Tooltip>View Details</Tooltip>}>
                    <Button variant="outline-primary" onClick={() => handleViewProduct(product)}>
                      <FaEye />
                    </Button>
                  </OverlayTrigger>
                  {canManageProducts() && (
                    <>
                      <OverlayTrigger overlay={<Tooltip>Manage Colors & Fabrics</Tooltip>}>
                        <Button variant="outline-info" onClick={() => handleManageColorsFabrics(product)}>
                          <FaPalette />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger overlay={<Tooltip>Edit Product</Tooltip>}>
                        <Button variant="outline-warning" onClick={() => handleEditProduct(product)}>
                          <FaEdit />
                        </Button>
                      </OverlayTrigger>
                      <OverlayTrigger overlay={<Tooltip>Delete Product</Tooltip>}>
                        <Button variant="outline-danger" onClick={() => handleDeleteProduct(product)}>
                          <FaTrash />
                        </Button>
                      </OverlayTrigger>
                    </>
                  )}
                </ButtonGroup>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading products...</p>
      </div>
    );
  }

  if (!canViewProducts()) {
    return (
      <Alert variant="danger">
        <FaBoxes className="me-2" />
        You do not have permission to view products.
      </Alert>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-1">
            <FaBoxes className="me-2 text-primary" />
            Product Management
          </h3>
          <p className="text-muted mb-0">
            Manage products with colors and fabric variations
          </p>
        </div>
        {canManageProducts() && (
          <div className="d-flex gap-2">
            <Button variant="outline-secondary" onClick={loadData}>
              <FaSync className="me-1" />
              Refresh
            </Button>
            <Button variant="primary" onClick={handleCreateProduct}>
              <FaPlus className="me-1" />
              Add Product
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {dashboardStats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <FaBoxes size={32} className="text-primary mb-2" />
                <h4 className="mb-1">{dashboardStats.total_products || filteredProducts.length}</h4>
                <small className="text-muted">Total Products</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <FaPalette size={32} className="text-info mb-2" />
                <h4 className="mb-1">{availableColors.length}</h4>
                <small className="text-muted">Available Colors</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <FaCouch size={32} className="text-warning mb-2" />
                <h4 className="mb-1">{availableFabrics.length}</h4>
                <small className="text-muted">Available Fabrics</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <FaChartBar size={32} className="text-success mb-2" />
                <h4 className="mb-1">
                  {formatCurrency(filteredProducts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0))}
                </h4>
                <small className="text-muted">Total Value</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Search and Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Row className="g-3 align-items-end">
            <Col md={4}>
              <Form.Label>Search Products</Form.Label>
              <InputGroup>
                <InputGroup.Text><FaSearch /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search by name, SKU, color, fabric..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Label>Filter By</Form.Label>
              <Form.Select value={filterBy} onChange={(e) => setFilterBy(e.target.value)}>
                <option value="all">All Products</option>
                <option value="with-colors">With Colors</option>
                <option value="with-fabrics">With Fabrics</option>
                <option value="no-colors">No Colors</option>
                <option value="no-fabrics">No Fabrics</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Label>Sort By</Form.Label>
              <Form.Select value={`${sortBy}-${sortOrder}`} onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>View</Form.Label>
              <ButtonGroup className="w-100">
                <Button 
                  variant={activeTab === 'grid' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('grid')}
                >
                  <FaLayerGroup />
                </Button>
                <Button 
                  variant={activeTab === 'table' ? 'primary' : 'outline-primary'}
                  onClick={() => setActiveTab('table')}
                >
                  <FaBoxes />
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center py-5">
          <Card.Body>
            <FaBoxes size={64} className="text-muted mb-3" />
            <h5 className="text-muted">No Products Found</h5>
            <p className="text-muted">
              {query ? 'Try adjusting your search criteria' : 'No products available yet'}
            </p>
            {canManageProducts() && (
              <Button variant="primary" onClick={handleCreateProduct}>
                <FaPlus className="me-1" />
                Create First Product
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        activeTab === 'grid' ? renderGridView() : renderTableView()
      )}

      {/* Product Modal */}
      <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Create New Product' : 
             modalMode === 'edit' ? 'Edit Product' : 'Product Details'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalMode === 'view' && selectedProduct ? (
            <div>
              <Row>
                <Col md={6}>
                  <h5>{selectedProduct.name}</h5>
                  <p className="text-muted">{selectedProduct.description}</p>
                  <p><strong>SKU:</strong> {selectedProduct.sku || 'N/A'}</p>
                  <p><strong>Price:</strong> {formatCurrency(selectedProduct.price)}</p>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong>Available Colors:</strong>
                    <div className="mt-2">
                      {selectedProduct.available_colors?.length > 0 ? 
                        selectedProduct.available_colors.map((color, index) => (
                          <Badge key={index} bg="primary" className="me-1 mb-1">
                            <FaPalette className="me-1" />
                            {color.name || color}
                          </Badge>
                        )) : 'No colors available'
                      }
                    </div>
                  </div>
                  <div>
                    <strong>Available Fabrics:</strong>
                    <div className="mt-2">
                      {selectedProduct.available_fabrics?.length > 0 ? 
                        selectedProduct.available_fabrics.map((fabric, index) => (
                          <Badge key={index} bg="secondary" className="me-1 mb-1">
                            <FaCouch className="me-1" />
                            {fabric.name || fabric}
                          </Badge>
                        )) : 'No fabrics available'
                      }
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          ) : (
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Product Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({...productForm, name: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>SKU</Form.Label>
                    <Form.Control
                      type="text"
                      value={productForm.sku}
                      onChange={(e) => setProductForm({...productForm, sku: e.target.value})}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Price (ZAR) *</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      value={productForm.price}
                      onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              {/* Colors and Fabrics will be managed in separate modal */}
              <div className="text-muted">
                <small>Colors and fabrics can be managed after saving the product.</small>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProductModal(false)}>
            Cancel
          </Button>
          {modalMode !== 'view' && (
            <Button variant="primary" onClick={handleSaveProduct}>
              {modalMode === 'create' ? 'Create Product' : 'Save Changes'}
            </Button>
          )}
          {modalMode === 'view' && canManageProducts() && (
            <Button variant="warning" onClick={() => handleEditProduct(selectedProduct)}>
              <FaEdit className="me-1" />
              Edit Product
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Color/Fabric Management Modal */}
      <ProductColorFabricManager
        show={showColorFabricModal}
        onHide={() => setShowColorFabricModal(false)}
        product={selectedProduct}
        onProductUpdate={handleProductUpdate}
        user={user}
      />
    </div>
  );
};

export default WarehouseProducts;