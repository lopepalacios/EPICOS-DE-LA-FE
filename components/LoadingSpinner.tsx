import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <>
      <div className="spinner-container" role="status" aria-label="Cargando">
        <div className="spinner"></div>
        <p className="spinner-text">Forjando Héroe...</p>
      </div>
    </>
  );
};

export default LoadingSpinner;