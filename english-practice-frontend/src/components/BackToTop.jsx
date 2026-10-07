
import React, { useState, useEffect } from 'react';
import './assets/css/BackToTop.css';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Hiển thị button khi scroll xuống 200px
  const toggleVisibility = () => {
    if (window.pageYOffset > 200) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Scroll về đầu trang
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);

    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <div className="back-to-top">
      {isVisible && 
        <button onClick={scrollToTop} className="back-to-top-button">
          <i className="fas fa-arrow-up"></i>
        </button>}
    </div>
  );
};

export default BackToTop;
