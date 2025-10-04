'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  HelpCircle, 
  BookOpen, 
  Smartphone, 
  Wifi, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Thermometer,
  Droplets,
  Wind,
  Database,
  RefreshCw,
  WifiOff,
  AlertTriangle,
  Settings,
  FileText,
  ChevronRight,
  ChevronDown
} from 'lucide-react'

export default function HelpPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: BookOpen,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Welcome to ROVOCS</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ROVOCS is a breath analysis system that detects volatile organic compounds (VOCs) 
              and equivalent CO₂ (eCO₂) from your breath using ESP32 sensors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Device Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm">Connect your ESP32 device to Wi-Fi</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm">Register device in the dashboard</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <p className="text-sm">Pair device with your account</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Activity className="w-4 h-4 mr-2" />
                  First Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm">Start a breathing session</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm">Blow into the sensor device</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <p className="text-sm">View real-time data</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'understanding-data',
      title: 'Understanding Your Data',
      icon: Database,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Sensor Measurements Explained</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your ROVOCS device measures several key indicators of respiratory health and environmental conditions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Wind className="w-4 h-4 mr-2" />
                  TVOC (Total Volatile Organic Compounds)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Measures organic compounds in your breath that can indicate various health conditions.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Good: 0-200 ppb</span>
                      <span className="text-yellow-600">Moderate: 200-500 ppb</span>
                      <span className="text-red-600">High: 500+ ppb</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Activity className="w-4 h-4 mr-2" />
                  eCO₂ (Equivalent CO₂)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Indicates CO₂ levels in your breath, related to metabolic activity and lung function.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Normal: 400-600 ppm</span>
                      <span className="text-yellow-600">Elevated: 600-1000 ppm</span>
                      <span className="text-red-600">High: 1000+ ppm</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Thermometer className="w-4 h-4 mr-2" />
                  Temperature
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Ambient temperature affects sensor accuracy and breath analysis results.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Optimal: 20-25°C</span>
                      <span className="text-yellow-600">Acceptable: 15-30°C</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Droplets className="w-4 h-4 mr-2" />
                  Humidity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Relative humidity affects sensor performance and breath analysis accuracy.
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Optimal: 40-60%</span>
                      <span className="text-yellow-600">Acceptable: 30-70%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: AlertCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Common Issues and Solutions</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Here are solutions to the most common problems you might encounter.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <WifiOff className="w-4 h-4 mr-2 text-red-500" />
                  Device Connection Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Check Wi-Fi Connection</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Ensure your ESP32 device is connected to the same Wi-Fi network as your computer/phone.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Verify Device Pairing</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Make sure the device is properly paired with your account using the correct pairing code.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Restart Device</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Power cycle your ESP32 device and wait for it to reconnect.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                  Data Quality Issues
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Check Sensor Calibration</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Allow sensors to warm up for 2-3 minutes before taking measurements.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Environmental Conditions</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Ensure testing in a well-ventilated area with stable temperature and humidity.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Proper Breathing Technique</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Take a deep breath and exhale steadily into the sensor for 3-5 seconds.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                  App Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Clear Browser Cache</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Clear your browser cache and cookies, then refresh the page.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Check Internet Connection</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Ensure you have a stable internet connection for real-time data updates.</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Update Browser</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Use the latest version of Chrome, Firefox, Safari, or Edge for best performance.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: HelpCircle,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Common Questions</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Find answers to the most frequently asked questions about ROVOCS.
            </p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How accurate are the sensor readings?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Our MQ-135 and SGP30 sensors provide reliable measurements for breath analysis. 
                  Accuracy is optimized when used in stable environmental conditions (20-25°C, 40-60% humidity) 
                  and with proper breathing technique.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How often should I take measurements?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  For general health monitoring, we recommend taking measurements 2-3 times per week. 
                  For specific health conditions or research purposes, consult with your healthcare provider 
                  for personalized recommendations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Can I use multiple devices with one account?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, you can register and use multiple ESP32 devices with a single account. 
                  Each device will be tracked separately, and you can switch between them in the dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">How do I export my data?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You can generate detailed reports from the Reports page. These reports include CSV data 
                  and PDF summaries that you can download and share with healthcare providers.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Is my data secure and private?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Yes, all data is encrypted and stored securely. We use industry-standard security practices 
                  and never share your personal health data without your explicit consent.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">What should I do if my device stops working?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  First, try restarting the device and checking your Wi-Fi connection. If the problem persists, 
                  check the troubleshooting section above or contact our support team for assistance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    {
      id: 'technical-specs',
      title: 'Technical Specifications',
      icon: Settings,
      content: (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">System Specifications</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Technical details about the ROVOCS system components and capabilities.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Activity className="w-4 h-4 mr-2" />
                  Hardware Components
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Microcontroller:</span>
                    <span>ESP32</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">VOC Sensor:</span>
                    <span>MQ-135</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Air Quality Sensor:</span>
                    <span>SGP30</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Environmental Sensor:</span>
                    <span>BME280</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Database className="w-4 h-4 mr-2" />
                  Measurement Ranges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">TVOC:</span>
                    <span>0-1000 ppb</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">eCO₂:</span>
                    <span>400-2000 ppm</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Temperature:</span>
                    <span>-40°C to 85°C</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Humidity:</span>
                    <span>0-100% RH</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <Wifi className="w-4 h-4 mr-2" />
                  Connectivity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Wi-Fi:</span>
                    <span>802.11 b/g/n</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Data Rate:</span>
                    <span>1 reading/second</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Range:</span>
                    <span>Up to 100m</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Power:</span>
                    <span>USB/5V</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <FileText className="w-4 h-4 mr-2" />
                  Software Stack
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Frontend:</span>
                    <span>Next.js 15</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Database:</span>
                    <span>PostgreSQL</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">ORM:</span>
                    <span>Prisma</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Authentication:</span>
                    <span>NextAuth.js</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Help Center</h1>
              <p className="text-gray-600 dark:text-gray-400">Get support and learn how to use ROVOCS effectively</p>
            </div>
          </div>
        </motion.div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={expandedSections.has(section.id) ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSection(section.id)}
                className="flex items-center space-x-2"
              >
                <section.icon className="w-4 h-4" />
                <span>{section.title}</span>
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1, duration: 0.5 }}
            >
              <Card>
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  onClick={() => toggleSection(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <section.icon className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                    {expandedSections.has(section.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </CardHeader>
                {expandedSections.has(section.id) && (
                  <CardContent>
                    {section.content}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  )
}
