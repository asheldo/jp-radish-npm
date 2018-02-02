import React from 'react'

import { Link } from 'react-junctions'

import './App.css'

export const Navbar = () => (
	<ul className="Navbar">
	<li><Link href="/">PokornyX Translations</Link> |</li>
	<li><Link href="/api-reference">PokornyX Reference</Link> |</li>
	<li><Link href="/login">Login</Link></li>
	</ul>)
