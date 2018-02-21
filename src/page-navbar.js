import React from 'react'

import { Link } from 'react-junctions'

import './App.css'

export const Navbar = () => (
	<ul className="Navbar">
	<li><Link href={process.env.PUBLIC_URL}>PokornyX Translations</Link> |</li>
	<li><Link href={process.env.PUBLIC_URL+'/api-reference'}>PokornyX Reference</Link> |</li>
	<li><Link href={process.env.PUBLIC_URL+'/login'}>Login</Link></li>
	</ul>)
