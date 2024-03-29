import React, { Component } from "react";
import { HashRouter as Router, Link } from "react-router-dom";
import Logout from "../LogOutButton/LogOutButton";
import './Nav.css';

class Nav extends Component {

  render() {
    return (
       <header class="header-area header-sticky">
        <div class="container">
            <div class="row">
                <div class="col-12">
                    <nav class="main-nav">
                        <a class="logo">
                            <img src="https://cdn11.bigcommerce.com/s-et4qthkygq/images/stencil/177x60/htwlogo_web_1573140308__59565.original.png" alt="Heat Transfer Warehouse"/>
                        </a>
                        <div className="nav">
        <Router>
          {/*HTW logo at top*/}
          <div>
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/resources" className="nav-link">Resources</Link>
              <Link to="/sanmar" className="nav-link">SanMar</Link>
              <Link to="/brightpearl" className="nav-link">Brightpearl</Link>
              <Link to="/nostock" className="nav-link">No Stock</Link>
              <Link to="/affiliates" className="nav-link">Affiliates</Link>
              <Link to="/decoqueue" className="nav-link">DecoQueue</Link>
              <Link to="/admin" className="nav-link">Admin</Link>
          </div>
          </Router>
      </div>
                        <a class='menu-trigger'>
                            <span>Menu</span>
                        </a>
                    </nav>
                </div>
            </div>
        </div>
    </header>
      
    )
  }
}
//grab the count of all of the queues

export default Nav;
