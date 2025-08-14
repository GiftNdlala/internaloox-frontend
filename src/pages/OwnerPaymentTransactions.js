import React, { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Form, Button, Table, Spinner, Alert, InputGroup } from 'react-bootstrap';
import { FaMoneyBillWave, FaSearch, FaFilter, FaSync } from 'react-icons/fa';
import UniversalSidebar from '../components/UniversalSidebar';
import SharedHeader from '../components/SharedHeader';
import { getPaymentTransactions } from '../components/api';
import PdfViewer from '../components/PdfViewer';
import { Modal } from 'react-bootstrap';
import { getPaymentProofSignedUrl, getPaymentProofFileUrl } from '../components/api';

const OwnerPaymentTransactions = ({ user, onLogout }) => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [transactions, setTransactions] = useState([]);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [total, setTotal] = useState(0);
	const [filters, setFilters] = useState({ order: '', customer: '', method: '', status: '', user: '', since: '', until: '' });
	const [viewer, setViewer] = useState({ open: false, url: '', name: '' });

	const fetchTx = async (p = page, ps = pageSize, f = filters) => {
		setLoading(true);
		setError('');
		try {
			const params = { page: p, page_size: ps };
			Object.entries(f).forEach(([k, v]) => { if (v) params[k] = v; });
			const res = await getPaymentTransactions(params);
			const list = Array.isArray(res?.results) ? res.results : (Array.isArray(res) ? res : []);
			setTransactions(list);
			setTotal(res?.count !== undefined ? res.count : (Array.isArray(res) ? res.length : 0));
			setPage(p);
			setPageSize(ps);
		} catch (e) {
			setError(e?.message || 'Failed to load transactions');
		} finally {
			setLoading(false);
		}
	};

  const openProof = async (tx) => {
    const proof = tx?.proof;
    if (!proof?.id) return;
    try {
      // Prefer signed URL; fallback to direct file endpoint
      let url = '';
      try {
        const res = await getPaymentProofSignedUrl(proof.id, 300);
        url = res?.url || '';
      } catch {}
      if (!url) {
        url = getPaymentProofFileUrl(proof.id);
      }
      const name = proof?.file_name || `proof_${proof.id}.pdf`;
      setViewer({ open: true, url, name });
    } catch (e) {
      setError(e?.message || 'Unable to open proof');
    }
  };

  const closeViewer = () => setViewer({ open: false, url: '', name: '' });

	useEffect(() => { fetchTx(1, pageSize, filters); }, []);

	const onFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
	const applyFilters = () => fetchTx(1, pageSize, filters);
	const resetFilters = () => { const f = { order: '', customer: '', method: '', status: '', user: '', since: '', until: '' }; setFilters(f); fetchTx(1, pageSize, f); };

	return (
		<>
			<UniversalSidebar user={user} userRole="owner" onLogout={onLogout} />
			<div className="main-content">
				<SharedHeader user={user} onLogout={onLogout} dashboardType="owner" />
				<Container fluid className="py-4">
					<Card className="mb-3 border-0 shadow-sm">
						<Card.Body className="d-flex justify-content-between align-items-center">
							<div className="d-flex align-items-center gap-2">
								<FaMoneyBillWave className="text-success" />
								<h5 className="mb-0">Payment Transactions</h5>
							</div>
							<div className="d-flex gap-2">
								<Button variant="outline-secondary" onClick={() => fetchTx(page, pageSize, filters)}><FaSync className="me-1"/>Refresh</Button>
							</div>
						</Card.Body>
					</Card>

					<Card className="mb-3">
						<Card.Header className="d-flex align-items-center gap-2"><FaFilter /> Filters</Card.Header>
						<Card.Body>
							<Row className="g-3">
								<Col md={2}><Form.Control placeholder="Order #" name="order" value={filters.order} onChange={onFilterChange} /></Col>
								<Col md={2}><Form.Control placeholder="Customer" name="customer" value={filters.customer} onChange={onFilterChange} /></Col>
								<Col md={2}><Form.Select name="method" value={filters.method} onChange={onFilterChange}><option value="">Method</option><option value="cash">Cash</option><option value="card">Card</option><option value="EFT">EFT</option><option value="cheque">Cheque</option><option value="other">Other</option></Form.Select></Col>
								<Col md={2}><Form.Select name="status" value={filters.status} onChange={onFilterChange}><option value="">Status</option><option value="deposit_pending">Deposit Pending</option><option value="deposit_paid">Deposit Paid</option><option value="partial">Partial</option><option value="paid">Paid</option><option value="overdue">Overdue</option></Form.Select></Col>
								<Col md={2}><Form.Control placeholder="User ID" name="user" value={filters.user} onChange={onFilterChange} /></Col>
								<Col md={1}><Form.Control type="date" name="since" value={filters.since} onChange={onFilterChange} /></Col>
								<Col md={1}><Form.Control type="date" name="until" value={filters.until} onChange={onFilterChange} /></Col>
							</Row>
							<div className="d-flex gap-2 mt-3">
								<Button variant="primary" onClick={applyFilters}><FaSearch className="me-1"/>Apply</Button>
								<Button variant="outline-secondary" onClick={resetFilters}>Reset</Button>
							</div>
						</Card.Body>
					</Card>

					{error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
					{loading ? (
						<div className="text-center py-5"><Spinner animation="border" /></div>
					) : (
						<Card>
							<Card.Body className="p-0">
								<div className="table-responsive">
									<Table hover className="mb-0">
										<thead className="bg-light">
											<tr>
												<th>Date</th>
												<th>Order #</th>
												<th>Actor</th>
												<th>Method</th>
												<th>Amount Δ</th>
												<th>New Balance</th>
												<th>Status</th>
												<th>Proof</th>
												<th>Actions</th>
											</tr>
										</thead>
										<tbody>
											{transactions.map(tx => (
												<tr key={tx.id}>
													<td>{new Date(tx.created_at).toLocaleString()}</td>
													<td>{tx.order_number || tx.order}</td>
													<td>{tx.actor_user?.username || `${tx.actor_user?.first_name||''} ${tx.actor_user?.last_name||''}`}</td>
													<td>{tx.payment_method}</td>
													<td>{typeof tx.amount_delta === 'number' ? `R${tx.amount_delta.toFixed(2)}` : tx.amount_delta}</td>
													<td>{typeof tx.new_balance === 'number' ? `R${tx.new_balance.toFixed(2)}` : tx.new_balance}</td>
													<td>{tx.payment_status}</td>
													<td>{tx.proof?.id ? <a href={(tx.proof.absolute_url || tx.proof.proof_image || (tx.proof.id && (window?.OOX_API_BASE || 'https://internaloox-1.onrender.com/api') + `/payment-proofs/${tx.proof.id}/file/`))} target="_blank" rel="noreferrer">View</a> : '-'}</td>
													<td>{tx.proof?.id ? <Button variant="outline-primary" size="sm" onClick={()=>openProof(tx)}>Preview</Button> : '-'}</td>
												</tr>
											))}
											{transactions.length === 0 && (
												<tr><td colSpan={9} className="text-center text-muted py-4">No transactions</td></tr>
											)}
										</tbody>
									</Table>
								</div>
							</Card.Body>
							{total > pageSize && (
								<Card.Footer className="d-flex justify-content-between align-items-center">
									<div className="text-muted small">Page {page} of {Math.ceil(total / pageSize)}</div>
									<div className="d-flex gap-2">
										<Button variant="outline-secondary" size="sm" disabled={page<=1} onClick={()=>fetchTx(page-1, pageSize, filters)}>Prev</Button>
										<Button variant="outline-secondary" size="sm" disabled={(page*pageSize)>=total} onClick={()=>fetchTx(page+1, pageSize, filters)}>Next</Button>
									</div>
								</Card.Footer>
							)}
						</Card>
					)}
				</Container>
				<Modal show={viewer.open} onHide={closeViewer} size="lg" centered>
					<Modal.Header closeButton>
						<Modal.Title>Proof of Payment</Modal.Title>
					</Modal.Header>
					<Modal.Body>
						{viewer.url ? <PdfViewer url={viewer.url} fileName={viewer.name} height="75vh"/> : <div className="text-muted">No document</div>}
					</Modal.Body>
				</Modal>
			</div>
		</>
	);
};

export default OwnerPaymentTransactions;