import React from 'react';

const ToastBox = ({ children, className = '', ...props }) => (
  <div
    className={`fixed top-4 right-4 z-50 transition-all duration-500 transform ${className}`}
    {...props}
  >
    <div className="p-4 rounded-lg shadow-xl">
      {children}
    </div>
  </div>
);

export default ToastBox;
