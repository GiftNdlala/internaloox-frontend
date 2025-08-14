import React, { useEffect, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Spinner, Button, ButtonGroup } from 'react-bootstrap';
import { FaSearchPlus, FaSearchMinus, FaDownload } from 'react-icons/fa';

// Configure pdfjs worker from the installed pdfjs-dist package
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PdfViewer = ({ url, fileName = 'document.pdf', height = '70vh' }) => {
	const [numPages, setNumPages] = useState(null);
	const [pageNumber, setPageNumber] = useState(1);
	const [scale, setScale] = useState(1.1);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

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
		setError(err?.message || 'Failed to load PDF');
		setLoading(false);
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
		} catch {}
	};

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-2">
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
					<div className="text-center text-danger p-3">{error}</div>
				)}
				{!error && (
					<Document file={url} onLoadSuccess={onDocumentLoadSuccess} onLoadError={onDocumentLoadError} loading=" ">
						<div className="d-flex flex-column align-items-center py-3">
							{Array.from(new Array(numPages || 0), (el, index) => (
								<div key={`page_${index + 1}`} className="mb-3" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', background: 'white' }}>
									<Page pageNumber={index + 1} scale={scale} renderTextLayer={false} renderAnnotationLayer={false} />
								</div>
							))}
						</div>
					</Document>
				)}
			</div>
		</div>
	);
};

export default PdfViewer;