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
        // Fetch first page
        const first = await getProducts();
        const firstList = Array.isArray(first?.results) ? first.results : (Array.isArray(first) ? first : []);
        const combined = [...firstList];

        // If paginated, fetch all remaining pages using next links
        let nextUrl = first?.next || null;
        const token = localStorage.getItem('oox_token');
        const API_BASE = process.env.REACT_APP_API_BASE || 'https://internaloox-1.onrender.com/api';
        while (nextUrl) {
          // Normalize to absolute URL
          const absoluteUrl = nextUrl.startsWith('http') ? nextUrl : `${API_BASE}${nextUrl}`;
          const res = await fetch(absoluteUrl, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!res.ok) break;
          const page = await res.json();
          const pageList = Array.isArray(page?.results) ? page.results : (Array.isArray(page) ? page : []);
          combined.push(...pageList);
          nextUrl = page?.next || null;
        }
        setProducts(combined);
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
                  <td>{prod.product_name || prod.name || 'Unnamed Product'}</td>
                  <td>{prod.model_code || prod.sku || '-'}</td>
                  <td>{prod.default_color_code || prod.color || '-'}</td>
                  <td>{prod.default_fabric_letter || prod.fabric || '-'}</td>
                  <td>{prod.unit_price ? `R${prod.unit_price}` : prod.base_price ? `R${prod.base_price}` : '-'}</td>
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