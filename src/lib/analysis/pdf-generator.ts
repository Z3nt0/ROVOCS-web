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
  let yPosition = 20

  // Helper function to add text with automatic page breaks
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: string = '#000000') => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
    
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
    pdf.setTextColor(color)
    pdf.text(text, 20, yPosition)
    yPosition += fontSize * 0.5 + 5
  }

  // Helper function to add a line
  const addLine = () => {
    if (yPosition > pageHeight - 20) {
      pdf.addPage()
      yPosition = 20
    }
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10
  }

  // Header
  pdf.setFillColor(16, 185, 129) // Green color
  pdf.rect(0, 0, pageWidth, 40, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ROVOCS', 20, 25)
  
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Respiratory Health Report', 20, 35)
  
  yPosition = 60

  // Report Title
  addText(report.title, 18, true, '#1f2937')
  addLine()

  // Report Information
  addText('Report Information', 14, true, '#374151')
  addText(`Report Date: ${report.date.toLocaleDateString()}`, 12)
  addText(`Session Duration: ${report.duration}`, 12)
  addText(`Total Readings: ${report.readingCount}`, 12)
  addText(`Status: ${report.status.charAt(0).toUpperCase() + report.status.slice(1)}`, 12)
  
  if (report.device) {
    addText(`Device: ${report.device.name} (${report.device.serial})`, 12)
  } else {
    addText(`Device: Removed (Historical Report)`, 12)
  }
  
  addLine()

  // Summary Statistics
  addText('Summary Statistics', 14, true, '#374151')
  addText(`Average TVOC: ${report.summary.avgTVOC.toFixed(1)} ppb`, 12)
  addText(`Average eCO₂: ${report.summary.avgECO2.toFixed(1)} ppm`, 12)
  addText(`Average Temperature: ${report.summary.avgTemperature.toFixed(1)}°C`, 12)
  addText(`Average Humidity: ${report.summary.avgHumidity.toFixed(1)}%`, 12)
  
  addLine()

  // Breath Analysis (if available)
  if (report.breathAnalysis) {
    addText('Breath Analysis Results', 14, true, '#374151')
    addText(`Total Events: ${report.breathAnalysis.totalEvents}`, 12)
    addText(`Completed Events: ${report.breathAnalysis.completedEvents}`, 12)
    addText(`Average Baseline TVOC: ${report.breathAnalysis.avgBaselineTvoc.toFixed(1)} ppb`, 12)
    addText(`Average Baseline eCO₂: ${report.breathAnalysis.avgBaselineEco2.toFixed(1)} ppm`, 12)
    addText(`Average Peak TVOC: ${report.breathAnalysis.avgPeakTvoc.toFixed(1)} ppb`, 12)
    addText(`Average Peak eCO₂: ${report.breathAnalysis.avgPeakEco2.toFixed(1)} ppm`, 12)
    addText(`Average Recovery Time: ${report.breathAnalysis.avgRecoveryTime.toFixed(1)} seconds`, 12)
    addText(`Average Peak Percentage: ${report.breathAnalysis.avgPeakPercent.toFixed(1)}%`, 12)
    addText(`Average Time to Peak: ${report.breathAnalysis.avgTimeToPeak.toFixed(1)} seconds`, 12)
    addText(`Average Slope: ${report.breathAnalysis.avgSlope.toFixed(3)}`, 12)
    
    addLine()
  }

  // Recent Readings (if available)
  if (report.readings && report.readings.length > 0) {
    addText('Recent Sensor Readings', 14, true, '#374151')
    
    // Add table headers
    const tableStartY = yPosition
    const colPositions = [20, 50, 75, 100, 125, 150]
    
    // Table header
    pdf.setFillColor(249, 250, 251)
    pdf.rect(20, tableStartY - 5, pageWidth - 40, 10, 'F')
    
    const headers = ['Time', 'TVOC', 'eCO₂', 'Temp', 'Humidity', 'Date']
    headers.forEach((header, index) => {
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(55, 65, 81)
      pdf.text(header, colPositions[index], tableStartY + 2)
    })
    
    yPosition = tableStartY + 15
    
    // Add recent readings (limit to fit on page)
    const recentReadings = report.readings.slice(0, 15) // Limit to 15 readings
    recentReadings.forEach((reading) => {
      if (yPosition > pageHeight - 30) {
        pdf.addPage()
        yPosition = 20
      }
      
      const rowData = [
        new Date(reading.recordedAt).toLocaleTimeString(),
        `${reading.tvoc.toFixed(1)}`,
        `${reading.eco2.toFixed(1)}`,
        `${reading.temperature.toFixed(1)}`,
        `${reading.humidity.toFixed(1)}`,
        new Date(reading.recordedAt).toLocaleDateString()
      ]
      
      rowData.forEach((data, colIndex) => {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(0, 0, 0)
        pdf.text(data, colPositions[colIndex], yPosition)
      })
      
      yPosition += 8
    })
    
    addLine()
  }

  // Footer
  const footerY = pageHeight - 20
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(107, 114, 128)
  pdf.text('Generated by ROVOCS - Advanced Breath Analysis System', 20, footerY)
  pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth - 80, footerY)

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
