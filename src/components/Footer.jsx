import React from 'react';

function Footer() {
  return (
    <footer>
      <div className="container">
        <div className="footer-container">
          <div className="footer-brand">
            <i className="fas fa-recycle"></i>
            <span>EcoVision Waste Analyzer</span>
          </div>
          <div className="footer-social">
            <a href="#">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="#">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
        </div>
        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} EcoVision. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export default Footer; 