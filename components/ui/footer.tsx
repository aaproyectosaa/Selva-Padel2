"use client"

import React from "react"

export function Footer() {
  return (
    <footer className="bg-green-800 text-white py-6">
      <div className="container mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} PadelReserva. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
} 