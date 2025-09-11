import React, { useEffect, useState } from 'react';

/**
 * SecureImage fetches a protected image with Authorization header and renders it.
 * Props:
 * - srcUrl: string - the protected URL
 * - alt: string
 * - style/className... forwarded to <img>
 */
const SecureImage = ({ srcUrl, alt = '', ...imgProps }) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;
    let objectUrl = null;
    setError(null);
    setBlobUrl(null);

    const load = async () => {
      try {
        const token = localStorage.getItem('oox_token');
        const res = await fetch(srcUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!aborted) setBlobUrl(objectUrl);
      } catch (e) {
        if (!aborted) setError(e);
      }
    };

    if (srcUrl) load();

    return () => {
      aborted = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [srcUrl]);

  if (error) return null;
  if (!blobUrl) return null;
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img src={blobUrl} alt={alt} {...imgProps} />;
};

export default SecureImage;

