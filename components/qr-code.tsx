"use client"

import { useEffect, useRef } from "react"

interface QRCodeProps {
  data: string
  size?: number
}

export default function QRCode({ data, size = 200 }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const generateQR = async () => {
      // Dynamically import QRCode.js
      const QRCodeGenerator = await import("qrcode")

      try {
        await QRCodeGenerator.toCanvas(canvasRef.current, data, {
          width: size,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#ffffff",
          },
        })
      } catch (err) {
        console.error("Error generating QR code:", err)
      }
    }

    generateQR()
  }, [data, size])

  return <canvas ref={canvasRef} width={size} height={size} />
}
