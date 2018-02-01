import React from 'react'
import { Link } from 'react-junctions'

export const Navbar = () =>
  <ul className="Navbar">
    <li><Link href="/">Pokorny Junctions</Link></li>
    <li><Link href="/api-reference">Pokorny Junctions API Reference</Link></li>
  </ul>
