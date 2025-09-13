import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spinner, Button, ButtonGroup } from 'react-bootstrap';
import { FaSearchPlus, FaSearchMinus, FaDownload } from 'react-icons/fa';

// Configure pdfjs worker to a reliable CDN URL (avoids bundling issues)
const setupPdfWorker = () => {
  try {
    pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.31/build/pdf.worker.min.mjs';
  } catch (error) {
    console.warn('Failed to set PDF.js worker source:', error);
  }
};

// Initialize worker immediately when module loads
setupPdfWorker();

const PdfViewer = ({ url, fileName = 'document.pdf', height = '70vh' }) => {
	const [numPages, setNumPages] = useState(null);
	const [pageNumber, setPageNumber] = useState(1);
	const [scale, setScale] = useState(1.1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [forceIframe, setForceIframe] = useState(false);

  // Protected API helpers
  const API_BASE = (typeof window !== 'undefined' && window.OOX_API_BASE) || process.env.REACT_APP_API_BASE || 'https://internaloox-1.onrender.com/api';
  const token = (typeof window !== 'undefined') ? localStorage.getItem('oox_token') : null;
  const isProtectedApiUrl = (u) => {
    if (!u) return false;
    try {
      const parsed = new URL(u, window.location.origin);
      const apiBase = new URL(API_BASE, window.location.origin);
      return parsed.origin === apiBase.origin && parsed.pathname.startsWith(apiBase.pathname);
    } catch {
      return false;
    }
  };

  // Avoid attaching Authorization to signed URLs
  const shouldAttachAuth = (u) => {
    if (!isProtectedApiUrl(u) || !token) return false;
    try {
      const { pathname } = new URL(u, window.location.origin);
      if (pathname.includes('/payment-proofs/signed_file/')) return false;
    } catch {}
    return true;
  };

  useEffect(() => {
    const update = () => setContainerWidth(containerRef.current ? containerRef.current.clientWidth : 0);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

	useEffect(() => {
		setPageNumber(1);
		setNumPages(null);
		setLoading(true);
		setError('');
		setForceIframe(false);
	}, [url]);

	const onDocumentLoadSuccess = ({ numPages }) => {
		setNumPages(numPages);
		setLoading(false);
	};

	const onDocumentLoadError = (err) => {
		console.error('PDF load error:', err);
		setError('Failed to load PDF. You can try opening it in a new tab.');
		setLoading(false);
	};

	const zoomIn = () => setScale((s) => Math.min(2.5, s + 0.2));
	const zoomOut = () => setScale((s) => Math.max(0.6, s - 0.2));
	const download = async () => {
		try {
			if (shouldAttachAuth(url)) {
				const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const blob = await res.blob();
				const objectUrl = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = objectUrl;
				a.download = fileName;
				a.click();
				URL.revokeObjectURL(objectUrl);
			} else {
				const a = document.createElement('a');
				a.href = url;
				a.download = fileName;
				a.target = '_blank';
				a.rel = 'noreferrer';
				a.click();
			}
		} catch (err) {
			console.error('Download error:', err);
		}
	};

  const openInNewTab = async () => {
    try {
      if (shouldAttachAuth(url)) {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        window.open(objectUrl, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Open in new tab error:', err);
    }
  };

	const isImage = (() => {
		const name = fileName || '';
		const testUrl = url || '';
		return /(\.png|\.jpe?g|\.webp|\.gif)$/i.test(name) || /(\.png|\.jpe?g|\.webp|\.gif)$/i.test(testUrl);
	})();
  const isPdf = (() => {
    const name = fileName || '';
    const testUrl = url || '';
    return /\.pdf$/i.test(name) || /\.pdf$/i.test(testUrl);
  })();

	return (
		<div ref={containerRef}>
			<div className="d-flex justify-content-between align-items-center mb-3">
				<div className="small text-muted">{fileName}</div>
				<ButtonGroup>
					<Button variant="outline-secondary" size="sm" onClick={zoomOut}><FaSearchMinus /></Button>
					<Button variant="outline-secondary" size="sm" onClick={zoomIn}><FaSearchPlus /></Button>
					<Button variant="outline-secondary" size="sm" onClick={download}><FaDownload /></Button>
				</ButtonGroup>
			</div>
			<div style={{ height, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb' }}>
				{loading && !error && (
					<div className="d-flex justify-content-center align-items-center" style={{ height }}>
						<Spinner animation="border" />
					</div>
				)}
				{error && (
					<div className="text-center text-danger p-3">
						<div className="mb-2">{error}</div>
						<Button variant="outline-primary" size="sm" onClick={openInNewTab}>
							Open in New Tab
						</Button>
					</div>
				)}
				{!error && isImage && (
					<div className="d-flex justify-content-center py-3">
						<img src={url} alt={fileName} style={{ maxWidth: '100%', maxHeight: `calc(${height} - 40px)`, objectFit: 'contain' }} />
					</div>
				)}
				{!error && !isImage && !forceIframe && isPdf && (
					<Document 
						file={shouldAttachAuth(url) ? { url, httpHeaders: { Authorization: `Bearer ${token}` } } : url}
						onLoadSuccess={onDocumentLoadSuccess} 
						onLoadError={onDocumentLoadError} 
						loading=" "
						error={<div className="text-center text-danger p-3">Failed to load PDF</div>}
					>
						<div className="d-flex flex-column align-items-center py-3">
							{Array.from(new Array(numPages || 0), (el, index) => (
								<div key={`page_${index + 1}`} className="mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'white' }}>
									<Page pageNumber={index + 1} width={Math.max(320, Math.min(1200, Math.floor((containerWidth || 800) * scale)))} renderTextLayer={false} renderAnnotationLayer={false} />
								</div>
							))}
						</div>
					</Document>
				)}
        {!error && !isPdf && (
          <iframe title={fileName} src={url} style={{ width: '100%', height, border: 0 }} />
        )}
			</div>
		</div>
	);
};

export default PdfViewer;