import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spinner, Button, ButtonGroup } from 'react-bootstrap';
import { FaSearchPlus, FaSearchMinus, FaDownload } from 'react-icons/fa';

// Configure pdfjs worker to a locally bundled worker for reliability
const setupPdfWorker = () => {
  try {
    // Bundle worker from node_modules (esm mjs build)
    // CRA/Webpack can resolve this URL during build
    // eslint-disable-next-line no-new
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url);
  } catch (error) {
    // As an absolute last resort, keep default (may show fake worker warning)
  }
};

// Initialize worker
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
	}, [url]);

	const onDocumentLoadSuccess = ({ numPages }) => {
		setNumPages(numPages);
		setLoading(false);
	};

	const onDocumentLoadError = (err) => {
		console.error('PDF load error:', err);
		setError(err?.message || 'Failed to load PDF. Please try refreshing the page.');
		setLoading(false);
    setForceIframe(true);
	};

	const zoomIn = () => setScale((s) => Math.min(2.5, s + 0.2));
	const zoomOut = () => setScale((s) => Math.max(0.6, s - 0.2));
	const download = () => {
		try {
			const a = document.createElement('a');
			a.href = url;
			a.download = fileName;
			a.target = '_blank';
			a.rel = 'noreferrer';
			a.click();
		} catch (err) {
			console.error('Download error:', err);
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
						<Button variant="outline-primary" size="sm" onClick={() => window.open(url, '_blank')}>
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
						file={url} 
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
        {!error && (forceIframe || !isPdf) && (
          <iframe title={fileName} src={url} style={{ width: '100%', height, border: 0 }} />
        )}
			</div>
		</div>
	);
};

export default PdfViewer;