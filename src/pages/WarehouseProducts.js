import React, { useEffect, useState } from 'react';
import { Button, Card, Form, InputGroup, Table, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { getProducts } from '../components/api';
import { FaPlus, FaSearch } from 'react-icons/fa';

const WarehouseProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProducts();
        const list = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
        setProducts(list);
      } catch (e) {
        setError(e?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = products.filter(p => {
    const q = query.toLowerCase();
    return !q || `${p.name || ''} ${p.sku || ''} ${p.color || ''}`.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Products</h4>
        <Button variant="primary" onClick={() => navigate('/warehouse/products/new')}>
          <FaPlus className="me-2" />
          Create New Product
        </Button>
      </div>

      <Card className="mb-3">
        <Card.Body>
          <InputGroup>
            <InputGroup.Text><FaSearch /></InputGroup.Text>
            <Form.Control
              placeholder="Search products by name, SKU, color..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>
      )}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
        </div>
      ) : (
        <Card>
          <Table responsive hover className="mb-0">
            <thead>
              <tr>
                <th>Name</th>
                <th>SKU</th>
                <th>Color</th>
                <th>Fabric</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(prod => (
                <tr key={prod.id}>
                  <td>{prod.name}</td>
                  <td>{prod.sku || '-'}</td>
                  <td>{prod.color || '-'}</td>
                  <td>{prod.fabric || '-'}</td>
                  <td>{typeof prod.price === 'number' ? `R${prod.price}` : '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">No products found</td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
};

export default WarehouseProducts;