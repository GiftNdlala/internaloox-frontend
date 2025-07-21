import React, { useState, useEffect } from 'react';
import { Card, Container, Row, Col, Button } from 'react-bootstrap';
import { FaClock, FaSync } from 'react-icons/fa';

const EnhancedPageHeader = ({ 
  title, 
  subtitle, 
  icon: IconComponent, 
  onRefresh,
  children,
  accentColor = '#f59e0b',
  bgGradient = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* Enhanced Page Header Styles */}
      <style>{`
        .enhanced-page-header {
          background: ${bgGradient};
          border-radius: 20px;
          border: 4px solid ${accentColor};
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
          overflow: hidden;
          position: relative;
        }
        .enhanced-page-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, ${accentColor}, ${accentColor}80, ${accentColor});
          animation: shimmer 3s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .page-title-section {
          padding: 2rem;
        }
        .page-icon-container {
          width: 60px;
          height: 60px;
          background: ${accentColor};
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          margin-right: 1.5rem;
          transition: all 0.3s ease;
        }
        .page-icon-container:hover {
          transform: scale(1.05) rotate(5deg);
          box-shadow: 0 6px 20px rgba(0,0,0,0.2);
        }
        .page-title {
          color: white;
          font-weight: 800;
          font-size: 1.75rem;
          margin-bottom: 0.5rem;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .page-subtitle {
          color: rgba(255,255,255,0.85);
          font-size: 1rem;
          margin-bottom: 0;
          font-weight: 500;
        }
        .page-time-display {
          background: rgba(255,255,255,0.1);
          border-radius: 25px;
          padding: 0.75rem 1.5rem;
          border: 1px solid ${accentColor}40;
          backdrop-filter: blur(10px);
          color: white;
          font-family: monospace;
          font-weight: 600;
          font-size: 1.1rem;
        }
        .page-refresh-btn {
          background: ${accentColor};
          border: none;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .page-refresh-btn:hover {
          background: ${accentColor}dd;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0,0,0,0.2);
        }
        .page-actions-section {
          padding: 0 2rem 1.5rem 2rem;
        }
        @media (max-width: 768px) {
          .page-title-section {
            padding: 1.5rem;
          }
          .page-title {
            font-size: 1.4rem;
          }
          .page-icon-container {
            width: 50px;
            height: 50px;
            margin-right: 1rem;
          }
          .page-actions-section {
            padding: 0 1.5rem 1.5rem 1.5rem;
          }
        }
      `}</style>

      <Container fluid className="mb-4">
        <Card className="enhanced-page-header border-0">
          {/* Title Section */}
          <div className="page-title-section">
            <Row className="align-items-center">
              <Col>
                <div className="d-flex align-items-center">
                  {IconComponent && (
                    <div className="page-icon-container">
                      <IconComponent size={28} />
                    </div>
                  )}
                  <div>
                    <h1 className="page-title mb-1">
                      {title}
                    </h1>
                    <p className="page-subtitle">
                      {subtitle}
                    </p>
                  </div>
                </div>
              </Col>
              
              {/* Time and Refresh Section */}
              <Col xs="auto" className="d-none d-lg-block">
                <div className="d-flex align-items-center gap-3">
                  <div className="page-time-display d-flex align-items-center">
                    <FaClock className="me-2" style={{ color: accentColor }} />
                    {currentTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </div>
                  {onRefresh && (
                    <Button 
                      className="page-refresh-btn d-flex align-items-center"
                      onClick={onRefresh}
                    >
                      <FaSync className="me-2" />
                      Refresh
                    </Button>
                  )}
                </div>
              </Col>
            </Row>
          </div>

          {/* Actions Section */}
          {children && (
            <div className="page-actions-section">
              {children}
            </div>
          )}
        </Card>

        {/* Mobile Time Display */}
        <div className="d-lg-none mt-3">
          <Card className="bg-light border-0">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <FaClock className="me-2" style={{ color: accentColor }} />
                  <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                    {currentTime.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </span>
                </div>
                {onRefresh && (
                  <Button 
                    size="sm"
                    style={{ background: accentColor, border: 'none' }}
                    onClick={onRefresh}
                  >
                    <FaSync />
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      </Container>
    </>
  );
};

export default EnhancedPageHeader;