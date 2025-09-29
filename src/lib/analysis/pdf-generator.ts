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


  // Simple Header without logo
  pdf.setFillColor(16, 185, 129) // Green color
  pdf.rect(0, 0, pageWidth, 30, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ROVOCS', 20, 20)
  
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Respiratory Health Report', 20, 27)
  
  yPosition = 45

  // Simple Report Title
  addText(report.title, 14, true, '#1f2937', 20)
  yPosition += 5
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

  // Simple Summary Statistics
  addSectionHeader('Summary Statistics')
  
  addText(`Average TVOC: ${report.summary.avgTVOC.toFixed(1)} ppb`, 10, false, '#374151')
  addText(`Average eCO₂: ${report.summary.avgECO2.toFixed(1)} ppm`, 10, false, '#374151')
  addText(`Average Temperature: ${report.summary.avgTemperature.toFixed(1)}°C`, 10, false, '#374151')
  addText(`Average Humidity: ${report.summary.avgHumidity.toFixed(1)}%`, 10, false, '#374151')
  
  addLine()

  // Simple Breath Analysis
  if (report.breathAnalysis) {
    addSectionHeader('Breath Analysis')
    
    // Calculate breath quality assessment
    const avgPeakPercent = report.breathAnalysis.avgPeakPercent
    const avgRecoveryTime = report.breathAnalysis.avgRecoveryTime
    
    let qualityText = 'Excellent'
    if (avgPeakPercent < 10 || avgRecoveryTime > 30) {
      qualityText = 'Poor'
    } else if (avgPeakPercent < 25 || avgRecoveryTime > 20) {
      qualityText = 'Fair'
    }
    
    addText(`Quality: ${qualityText}`, 10, true, '#374151')
    addText(`Total Events: ${report.breathAnalysis.totalEvents}`, 10, false, '#374151')
    addText(`Completed Events: ${report.breathAnalysis.completedEvents}`, 10, false, '#374151')
    addText(`Average Peak %: ${report.breathAnalysis.avgPeakPercent.toFixed(1)}%`, 10, false, '#374151')
    addText(`Average Recovery Time: ${report.breathAnalysis.avgRecoveryTime.toFixed(1)}s`, 10, false, '#374151')
    addText(`Average Time to Peak: ${report.breathAnalysis.avgTimeToPeak.toFixed(1)}s`, 10, false, '#374151')
    
    addLine()
  }

  // Simple Recent Readings
  if (report.readings && report.readings.length > 0) {
    addSectionHeader('Recent Readings')
    
    // Show only the most recent 3 readings in simple format
    const recentReadings = report.readings.slice(0, 3)
    
    recentReadings.forEach((reading) => {
      const time = new Date(reading.recordedAt).toLocaleTimeString()
      addText(`${time}: TVOC ${reading.tvoc.toFixed(0)} ppb, eCO₂ ${reading.eco2.toFixed(0)} ppm, ${reading.temperature.toFixed(0)}°C, ${reading.humidity.toFixed(0)}%`, 9, false, '#374151')
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
