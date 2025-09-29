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


  // Enhanced Header with gradient effect
  pdf.setFillColor(16, 185, 129) // Green color
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  // Add subtle gradient effect
  pdf.setFillColor(20, 200, 140)
  pdf.rect(0, 0, pageWidth, 5, 'F')
  
  // Enhanced logo area with better styling
  pdf.setFillColor(255, 255, 255)
  pdf.circle(30, 20, 8, 'F')
  pdf.setDrawColor(16, 185, 129)
  pdf.circle(30, 20, 8, 'S')
  
  // Add a small "R" inside the circle
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(16, 185, 129)
  pdf.text('R', 26, 24)
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ROVOCS', 50, 25)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Advanced Respiratory Health Analysis', 50, 33)
  
  yPosition = 45

  // Enhanced Report Title with better styling
  pdf.setFillColor(248, 250, 252)
  pdf.rect(15, yPosition - 8, pageWidth - 30, 18, 'F')
  pdf.setDrawColor(203, 213, 225)
  pdf.rect(15, yPosition - 8, pageWidth - 30, 18, 'S')
  
  // Add a subtle left border accent
  pdf.setFillColor(16, 185, 129)
  pdf.rect(15, yPosition - 8, 4, 18, 'F')
  
  addText(report.title, 16, true, '#1e293b', 25)
  yPosition += 12
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

  // Enhanced Summary Statistics with better visual design
  addSectionHeader('Summary Statistics')
  
  // Create enhanced stats with better visual hierarchy
  const stats = [
    { 
      label: 'TVOC', 
      value: `${report.summary.avgTVOC.toFixed(1)} ppb`, 
      color: '#3b82f6',
      bgColor: '#eff6ff',
      borderColor: '#3b82f6',
      icon: '📊'
    },
    { 
      label: 'eCO₂', 
      value: `${report.summary.avgECO2.toFixed(1)} ppm`, 
      color: '#10b981',
      bgColor: '#ecfdf5',
      borderColor: '#10b981',
      icon: '🌱'
    },
    { 
      label: 'Temperature', 
      value: `${report.summary.avgTemperature.toFixed(1)}°C`, 
      color: '#f59e0b',
      bgColor: '#fffbeb',
      borderColor: '#f59e0b',
      icon: '🌡️'
    },
    { 
      label: 'Humidity', 
      value: `${report.summary.avgHumidity.toFixed(1)}%`, 
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
      borderColor: '#8b5cf6',
      icon: '💧'
    }
  ]
  
  // Create enhanced 4-column grid for stats
  const gridStartY = yPosition
  const boxWidth = 42
  const boxHeight = 18
  const spacing = 6
  
  stats.forEach((stat, index) => {
    const x = 20 + index * (boxWidth + spacing)
    const y = gridStartY
    
    // Add enhanced background with subtle shadow effect
    pdf.setFillColor(stat.bgColor)
    pdf.rect(x, y, boxWidth, boxHeight, 'F')
    
    // Add colored border
    pdf.setDrawColor(stat.borderColor)
    pdf.setLineWidth(0.5)
    pdf.rect(x, y, boxWidth, boxHeight, 'S')
    
    // Add subtle inner border
    pdf.setDrawColor(255, 255, 255)
    pdf.setLineWidth(0.3)
    pdf.rect(x + 1, y + 1, boxWidth - 2, boxHeight - 2, 'S')
    
    // Add icon (using text as icon placeholder)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(stat.color)
    pdf.text(stat.icon, x + 3, y + 6)
    
    // Add label
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(107, 114, 128)
    pdf.text(stat.label, x + 8, y + 6)
    
    // Add value with enhanced styling
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(stat.color)
    pdf.text(stat.value, x + 3, y + 14)
  })
  
  yPosition = gridStartY + 22
  addLine()

  // Enhanced Breath Analysis with better visual design
  if (report.breathAnalysis) {
    addSectionHeader('Breath Analysis')
    
    // Calculate breath quality assessment with enhanced logic
    const avgPeakPercent = report.breathAnalysis.avgPeakPercent
    const avgRecoveryTime = report.breathAnalysis.avgRecoveryTime
    const completionRate = (report.breathAnalysis.completedEvents / report.breathAnalysis.totalEvents) * 100
    
    let qualityColor = '#10b981'
    let qualityText = 'Excellent'
    let qualityBg = '#dcfce7'
    let qualityIcon = '✅'
    
    if (avgPeakPercent < 10 || avgRecoveryTime > 30 || completionRate < 50) {
      qualityColor = '#ef4444'
      qualityText = 'Poor'
      qualityBg = '#fee2e2'
      qualityIcon = '❌'
    } else if (avgPeakPercent < 25 || avgRecoveryTime > 20 || completionRate < 80) {
      qualityColor = '#f59e0b'
      qualityText = 'Fair'
      qualityBg = '#fef3c7'
      qualityIcon = '⚠️'
    }
    
    // Enhanced quality indicator with better styling
    const qualityBoxWidth = 80
    const qualityBoxHeight = 12
    
    pdf.setFillColor(qualityBg)
    pdf.rect(20, yPosition - 6, qualityBoxWidth, qualityBoxHeight, 'F')
    
    pdf.setDrawColor(qualityColor)
    pdf.setLineWidth(0.5)
    pdf.rect(20, yPosition - 6, qualityBoxWidth, qualityBoxHeight, 'S')
    
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(qualityColor)
    pdf.text(`${qualityIcon} Quality: ${qualityText}`, 25, yPosition + 1)
    
    yPosition += 10
    
    // Create enhanced breath analysis metrics with better visual hierarchy
    const breathMetrics = [
      { 
        label: 'Events', 
        value: `${report.breathAnalysis.completedEvents}/${report.breathAnalysis.totalEvents}`,
        color: '#3b82f6',
        bgColor: '#eff6ff',
        icon: '📊'
      },
      { 
        label: 'Peak %', 
        value: `${report.breathAnalysis.avgPeakPercent.toFixed(1)}%`,
        color: '#10b981',
        bgColor: '#ecfdf5',
        icon: '📈'
      },
      { 
        label: 'Recovery', 
        value: `${report.breathAnalysis.avgRecoveryTime.toFixed(1)}s`,
        color: '#f59e0b',
        bgColor: '#fffbeb',
        icon: '⏱️'
      },
      { 
        label: 'Time to Peak', 
        value: `${report.breathAnalysis.avgTimeToPeak.toFixed(1)}s`,
        color: '#8b5cf6',
        bgColor: '#f3e8ff',
        icon: '⚡'
      }
    ]
    
    // Create enhanced 4-column grid for breath metrics
    const breathGridStartY = yPosition
    const breathBoxWidth = 42
    const breathBoxHeight = 16
    const breathSpacing = 6
    
    breathMetrics.forEach((metric, index) => {
      const x = 20 + index * (breathBoxWidth + breathSpacing)
      const y = breathGridStartY
      
      // Add enhanced background
      pdf.setFillColor(metric.bgColor)
      pdf.rect(x, y, breathBoxWidth, breathBoxHeight, 'F')
      
      // Add colored border
      pdf.setDrawColor(metric.color)
      pdf.setLineWidth(0.5)
      pdf.rect(x, y, breathBoxWidth, breathBoxHeight, 'S')
      
      // Add icon
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(metric.color)
      pdf.text(metric.icon, x + 3, y + 6)
      
      // Add label
      pdf.setFontSize(7)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(107, 114, 128)
      pdf.text(metric.label, x + 8, y + 6)
      
      // Add value with enhanced styling
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(metric.color)
      pdf.text(metric.value, x + 3, y + 13)
    })
    
    yPosition = breathGridStartY + 20
    addLine()
  }

  // Enhanced Recent Readings with better table design
  if (report.readings && report.readings.length > 0) {
    addSectionHeader('Recent Readings')
    
    // Show only the most recent 5 readings in an enhanced format
    const recentReadings = report.readings.slice(0, 5)
    
    // Add enhanced table headers
    const tableStartY = yPosition
    const colPositions = [20, 60, 90, 120, 150]
    
    // Enhanced table header with better styling
    pdf.setFillColor(248, 250, 252)
    pdf.rect(20, tableStartY - 4, pageWidth - 40, 10, 'F')
    
    // Add subtle border
    pdf.setDrawColor(203, 213, 225)
    pdf.setLineWidth(0.5)
    pdf.rect(20, tableStartY - 4, pageWidth - 40, 10, 'S')
    
    const headers = ['Time', 'TVOC', 'eCO₂', 'Temp', 'Humidity']
    headers.forEach((header, index) => {
      pdf.setFontSize(8)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(31, 41, 55)
      pdf.text(header, colPositions[index], tableStartY + 2)
    })
    
    yPosition = tableStartY + 8
    
    // Add recent readings with enhanced styling
    recentReadings.forEach((reading, index) => {
      // Alternate row colors for better readability
      if (index % 2 === 0) {
        pdf.setFillColor(249, 250, 251)
        pdf.rect(20, yPosition - 2, pageWidth - 40, 8, 'F')
      }
      
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
        pdf.setTextColor(55, 65, 81)
        pdf.text(data, colPositions[colIndex], yPosition + 2)
      })
      
      yPosition += 8
    })
    
    addLine()
  }

  // Enhanced Footer with better styling
  const footerY = pageHeight - 20
  
  // Add subtle footer background
  pdf.setFillColor(248, 250, 252)
  pdf.rect(0, footerY - 5, pageWidth, 20, 'F')
  
  // Add top border
  pdf.setDrawColor(229, 231, 235)
  pdf.setLineWidth(0.5)
  pdf.line(0, footerY - 5, pageWidth, footerY - 5)
  
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(16, 185, 129)
  pdf.text('ROVOCS', 20, footerY)
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(107, 114, 128)
  pdf.text('Advanced Breath Analysis System', 20, footerY + 5)
  
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(107, 114, 128)
  pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - 70, footerY)
  
  pdf.setFontSize(7)
  pdf.setTextColor(156, 163, 175)
  pdf.text(`Report ID: ${report.id}`, pageWidth - 70, footerY + 5)

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
