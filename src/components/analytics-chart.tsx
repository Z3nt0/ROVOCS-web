'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface AnalyticsChartProps {
  title: string
  data: Array<{
    label: string
    value: number
    color: string
    trend?: 'up' | 'down' | 'stable'
  }>
  type?: 'bar' | 'line' | 'donut'
}

export const AnalyticsChart = ({ title, data, type = 'bar' }: AnalyticsChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value))
  const totalValue = data.reduce((sum, d) => sum + d.value, 0)

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />
      default:
        return <Minus className="w-4 h-4 text-gray-600" />
    }
  }

  if (type === 'donut') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                {data.map((item, index) => {
                  const percentage = (item.value / totalValue) * 100
                  const circumference = 2 * Math.PI * 16
                  const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`
                  const strokeDashoffset = -((index * percentage) / 100) * circumference
                  
                  return (
                    <circle
                      key={item.label}
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke={item.color}
                      strokeWidth="3"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-500"
                    />
                  )
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{totalValue}</div>
                  <div className="text-xs text-gray-500">Total</div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {data.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{item.value}</span>
                  {getTrendIcon(item.trend)}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-gray-900">{item.value}</span>
                  {getTrendIcon(item.trend)}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.value / maxValue) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
                  className="h-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}




