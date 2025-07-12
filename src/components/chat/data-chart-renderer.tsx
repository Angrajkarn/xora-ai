
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { type ChartData } from '@/lib/types';
import { AreaChart, Area, Bar, BarChart, CartesianGrid, XAxis, YAxis, Legend, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface DataChartRendererProps {
  chartData: ChartData;
}

export function DataChartRenderer({ chartData }: DataChartRendererProps) {
    if (!chartData || !chartData.data) {
        return <p className="text-destructive text-sm">Error: Chart data is missing or invalid.</p>;
    }

    const renderChart = () => {
        switch (chartData.type) {
            case 'bar':
                return (
                    <BarChart data={chartData.data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey={chartData.dataKey} tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                            content={<ChartTooltipContent />}
                        />
                        <Legend />
                        {chartData.categories.map(cat => (
                            <Bar key={cat} dataKey={cat} fill={chartData.config[cat]?.color || '#8884d8'} radius={[4, 4, 0, 0]} name={chartData.config[cat]?.label} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <AreaChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey={chartData.dataKey} tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                            content={<ChartTooltipContent />}
                        />
                        <Legend />
                        {chartData.categories.map(cat => (
                            <Area key={cat} type="monotone" dataKey={cat} stroke={chartData.config[cat]?.color || '#8884d8'} fill="transparent" strokeWidth={2} name={chartData.config[cat]?.label} />
                        ))}
                    </AreaChart>
                );
            case 'area':
                return (
                    <AreaChart data={chartData.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                        <XAxis dataKey={chartData.dataKey} tickLine={false} axisLine={false} tickMargin={8} stroke="hsl(var(--muted-foreground))" />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--accent) / 0.1)' }}
                            content={<ChartTooltipContent />}
                        />
                        <Legend />
                        {chartData.categories.map(cat => (
                            <Area key={cat} type="monotone" dataKey={cat} stroke={chartData.config[cat]?.color || '#8884d8'} fill={chartData.config[cat]?.color || '#8884d8'} fillOpacity={0.1} strokeWidth={2} name={chartData.config[cat]?.label} />
                        ))}
                    </AreaChart>
                );
            case 'pie':
                 const pieData = chartData.data.map(item => ({
                    name: item[chartData.dataKey],
                    value: item[chartData.categories[0]], // Pie charts usually have one category
                    fill: chartData.config[item[chartData.dataKey]]?.color,
                }));
                return (
                    <PieChart>
                        <Tooltip content={<ChartTooltipContent />} />
                        <Pie data={pieData} dataKey="value" nameKey="name" innerRadius="60%" outerRadius="80%" paddingAngle={5} cy="50%">
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Legend />
                    </PieChart>
                );
            default:
                return <p className="text-destructive text-sm">Unsupported chart type: {chartData.type}</p>;
        }
    };
    
    return (
        <Card className="glassmorphic overflow-hidden">
            <CardHeader>
                {chartData.title && <CardTitle>{chartData.title}</CardTitle>}
                {chartData.description && <CardDescription>{chartData.description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartData.config} className="h-[300px] w-full">
                    {renderChart()}
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
