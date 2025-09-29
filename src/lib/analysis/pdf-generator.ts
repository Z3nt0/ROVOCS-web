import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface ReportData {
  id: string
  title: string
  date: Date
  duration: string
  readingCount: number
  status: 'completed' | 'processing' | 'failed'
  summary: {
    avgTVOC: number
    avgECO2: number
    avgTemperature: number
    avgHumidity: number
  }
  breathAnalysis?: {
    totalEvents: number
    completedEvents: number
    avgBaselineTvoc: number
    avgBaselineEco2: number
    avgPeakTvoc: number
    avgPeakEco2: number
    avgRecoveryTime: number
    avgPeakPercent: number
    avgTimeToPeak: number
    avgSlope: number
  }
  device?: {
    name: string
    serial: string
  }
  readings?: Array<{
    id: string
    tvoc: number
    eco2: number
    temperature: number
    humidity: number
    recordedAt: string
  }>
}

export const generateReportPDF = async (report: ReportData): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPosition = 15

  // Helper function to add text (compact version)
  const addText = (text: string, fontSize: number = 10, isBold: boolean = false, color: string = '#000000', x: number = 20) => {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
    pdf.setTextColor(color)
    pdf.text(text, x, yPosition)
    yPosition += fontSize * 0.4 + 3
  }

  // Helper function to add a compact section header
  const addSectionHeader = (text: string) => {
    // Add background color for section header
    pdf.setFillColor(249, 250, 251)
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F')
    
    // Add border
    pdf.setDrawColor(229, 231, 235)
    pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'S')
    
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(31, 41, 55)
    pdf.text(text, 20, yPosition + 2)
    yPosition += 12
  }

  // Helper function to add a compact line
  const addLine = () => {
    pdf.setDrawColor(229, 231, 235)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 8
  }

  // Helper function to add a compact colored box
  const addColoredBox = (text: string, color: string, backgroundColor: string) => {
    const textWidth = pdf.getTextWidth(text)
    const boxWidth = textWidth + 15
    const boxHeight = 8
    
    // Add background
    pdf.setFillColor(backgroundColor)
    pdf.rect(20, yPosition - 5, boxWidth, boxHeight, 'F')
    
    // Add border
    pdf.setDrawColor(color)
    pdf.rect(20, yPosition - 5, boxWidth, boxHeight, 'S')
    
    // Add text
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(color)
    pdf.text(text, 27, yPosition + 1)
    
    yPosition += 10
  }

  // Compact Header
  pdf.setFillColor(16, 185, 129) // Green color
  pdf.rect(0, 0, pageWidth, 35, 'F')
  
  // Add logo area (placeholder for future logo)
  pdf.setFillColor(255, 255, 255)
  pdf.circle(25, 18, 6, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ROVOCS', 40, 22)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Respiratory Health Report', 40, 30)
  
  yPosition = 45

  // Compact Report Title
  pdf.setFillColor(249, 250, 251)
  pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'F')
  pdf.setDrawColor(229, 231, 235)
  pdf.rect(15, yPosition - 5, pageWidth - 30, 12, 'S')
  
  addText(report.title, 14, true, '#1f2937', 20)
  yPosition += 8
  addLine()

  // Compact Report Information
  addSectionHeader('Report Information')
  
  // Create a compact layout for report info
  const leftColumn = 20
  
  addText(`Date: ${report.date.toLocaleDateString()}`, 9, false, '#6b7280', leftColumn)
  addText(`Duration: ${report.duration}`, 9, false, '#6b7280', leftColumn + 60)
  addText(`Readings: ${report.readingCount}`, 9, false, '#6b7280', leftColumn + 120)
  
  // Status with color coding
  const statusColor = report.status === 'completed' ? '#10b981' : 
                     report.status === 'processing' ? '#f59e0b' : '#ef4444'
  addText(`Status: ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`, 9, true, statusColor, leftColumn + 180)
  
  if (report.device) {
    addText(`Device: ${report.device.name}`, 9, false, '#6b7280', leftColumn)
  } else {
    addText(`Device: Removed (Historical)`, 9, false, '#6b7280', leftColumn)
  }
  
  addLine()

  // Compact Summary Statistics
  addSectionHeader('Summary Statistics')
  
  // Create a compact 4-column layout for stats
  const stats = [
    { label: 'TVOC', value: `${report.summary.avgTVOC.toFixed(1)} ppb`, color: '#3b82f6' },
    { label: 'eCO₂', value: `${report.summary.avgECO2.toFixed(1)} ppm`, color: '#10b981' },
    { label: 'Temp', value: `${report.summary.avgTemperature.toFixed(1)}°C`, color: '#f59e0b' },
    { label: 'Humidity', value: `${report.summary.avgHumidity.toFixed(1)}%`, color: '#8b5cf6' }
  ]
  
  // Create compact 4-column grid for stats
  const gridStartY = yPosition
  const boxWidth = 40
  const boxHeight = 15
  const spacing = 5
  
  stats.forEach((stat, index) => {
    const x = 20 + index * (boxWidth + spacing)
    const y = gridStartY
    
    // Add colored background
    pdf.setFillColor(249, 250, 251)
    pdf.rect(x, y, boxWidth, boxHeight, 'F')
    
    // Add border
    pdf.setDrawColor(229, 231, 235)
    pdf.rect(x, y, boxWidth, boxHeight, 'S')
    
    // Add label
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(107, 114, 128)
    pdf.text(stat.label, x + 3, y + 6)
    
    // Add value with color
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(stat.color)
    pdf.text(stat.value, x + 3, y + 12)
  })
  
  yPosition = gridStartY + 20
  addLine()

  // Compact Breath Analysis (if available)
  if (report.breathAnalysis) {
    addSectionHeader('Breath Analysis')
    
    // Calculate breath quality assessment
    const avgPeakPercent = report.breathAnalysis.avgPeakPercent
    const avgRecoveryTime = report.breathAnalysis.avgRecoveryTime
    
    let quality = 'excellent'
    let qualityColor = '#10b981'
    let qualityText = 'Excellent'
    
    if (avgPeakPercent < 10 || avgRecoveryTime > 30) {
      quality = 'poor'
      qualityColor = '#ef4444'
      qualityText = 'Poor'
    } else if (avgPeakPercent < 25 || avgRecoveryTime > 20) {
      quality = 'fair'
      qualityColor = '#f59e0b'
      qualityText = 'Fair'
    }
    
    // Add quality indicator
    addColoredBox(`Quality: ${qualityText}`, qualityColor, quality === 'excellent' ? '#dcfce7' : quality === 'fair' ? '#fef3c7' : '#fee2e2')
    
    // Create compact breath analysis metrics
    const breathMetrics = [
      { label: 'Events', value: `${report.breathAnalysis.completedEvents}/${report.breathAnalysis.totalEvents}` },
      { label: 'Peak %', value: `${report.breathAnalysis.avgPeakPercent.toFixed(1)}%` },
      { label: 'Recovery', value: `${report.breathAnalysis.avgRecoveryTime.toFixed(1)}s` },
      { label: 'Time to Peak', value: `${report.breathAnalysis.avgTimeToPeak.toFixed(1)}s` }
    ]
    
    // Create compact 4-column grid for breath metrics
    const breathGridStartY = yPosition
    const breathBoxWidth = 40
    const breathBoxHeight = 12
    const breathSpacing = 5
    
    breathMetrics.forEach((metric, index) => {
      const x = 20 + index * (breathBoxWidth + breathSpacing)
      const y = breathGridStartY
      
      // Add background
      pdf.setFillColor(249, 250, 251)
      pdf.rect(x, y, breathBoxWidth, breathBoxHeight, 'F')
      
      // Add border
      pdf.setDrawColor(229, 231, 235)
      pdf.rect(x, y, breathBoxWidth, breathBoxHeight, 'S')
      
      // Add label
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(107, 114, 128)
      pdf.text(metric.label, x + 2, y + 5)
      
      // Add value
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(31, 41, 55)
      pdf.text(metric.value, x + 2, y + 10)
    })
    
    yPosition = breathGridStartY + 15
    addLine()
  }

  // Compact Recent Readings (if available)
  if (report.readings && report.readings.length > 0) {
    addSectionHeader('Recent Readings')
    
    // Show only the most recent 5 readings in a compact format
    const recentReadings = report.readings.slice(0, 5)
    
    // Add compact table headers
    const tableStartY = yPosition
    const colPositions = [20, 60, 90, 120, 150]
    
    // Table header
    pdf.setFillColor(249, 250, 251)
    pdf.rect(20, tableStartY - 3, pageWidth - 40, 8, 'F')
    
    const headers = ['Time', 'TVOC', 'eCO₂', 'Temp', 'Humidity']
    headers.forEach((header, index) => {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(55, 65, 81)
      pdf.text(header, colPositions[index], tableStartY + 2)
    })
    
    yPosition = tableStartY + 10
    
    // Add recent readings in compact format
    recentReadings.forEach((reading) => {
      const rowData = [
        new Date(reading.recordedAt).toLocaleTimeString().slice(0, 5),
        `${reading.tvoc.toFixed(0)}`,
        `${reading.eco2.toFixed(0)}`,
        `${reading.temperature.toFixed(0)}`,
        `${reading.humidity.toFixed(0)}`
      ]
      
      rowData.forEach((data, colIndex) => {
        pdf.setFontSize(7)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        pdf.text(data, colPositions[colIndex], yPosition)
      })
      
      yPosition += 6
    })
    
    addLine()
  }

  // Compact Footer
  const footerY = pageHeight - 15
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(107, 114, 128)
  pdf.text('ROVOCS - Advanced Breath Analysis', 20, footerY)
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 60, footerY)

  // Download the PDF
  const fileName = `ROVOCS_Report_${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(fileName)
}

export const generateReportPDFFromElement = async (elementId: string, reportTitle: string): Promise<void> => {
  console.log('PDF Generation: Starting...')
  console.log('PDF Generation: Looking for element with ID:', elementId)
  
  const element = document.getElementById(elementId)
  if (!element) {
    console.error('PDF Generation: Element not found with ID:', elementId)
    throw new Error(`Element with ID '${elementId}' not found`)
  }

  console.log('PDF Generation: Element found, dimensions:', {
    width: element.offsetWidth,
    height: element.offsetHeight,
    scrollHeight: element.scrollHeight
  })

  try {
    console.log('PDF Generation: Starting html2canvas...')
    const canvas = await html2canvas(element, {
      scale: 1, // Reduced scale to avoid memory issues
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true, // Enable logging for debugging
      width: element.scrollWidth,
      height: element.scrollHeight,
      scrollX: 0,
      scrollY: 0
    })

    console.log('PDF Generation: Canvas created, dimensions:', {
      width: canvas.width,
      height: canvas.height
    })

    const imgData = canvas.toDataURL('image/png', 0.8) // Reduced quality to avoid size issues
    console.log('PDF Generation: Image data created, length:', imgData.length)

    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    console.log('PDF Generation: PDF created, page dimensions:', { pageWidth, pageHeight })
    
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    console.log('PDF Generation: Image dimensions for PDF:', { imgWidth, imgHeight })
    
    // Check if image fits on one page
    if (imgHeight > pageHeight - 20) {
      console.log('PDF Generation: Image too large for one page, scaling down...')
      const scale = (pageHeight - 20) / imgHeight
      const scaledWidth = imgWidth * scale
      const scaledHeight = imgHeight * scale
      pdf.addImage(imgData, 'PNG', 10, 10, scaledWidth, scaledHeight)
    } else {
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    }
    
    const fileName = `ROVOCS_Report_${reportTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    console.log('PDF Generation: Saving PDF with filename:', fileName)
    pdf.save(fileName)
    console.log('PDF Generation: PDF saved successfully')
  } catch (error) {
    console.error('PDF Generation: Error generating PDF from element:', error)
    throw error
  }
}
