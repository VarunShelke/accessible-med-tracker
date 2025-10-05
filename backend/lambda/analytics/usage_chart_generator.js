const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3Client = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
    try {
        const { startDate, endDate } = JSON.parse(event.body);
        
        if (!startDate || !endDate) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'startDate and endDate are required' })
            };
        }

        const usageData = await getUsageData(startDate, endDate);
        const svgChart = generateSVGChart(usageData);
        
        const s3Key = `usage-charts/${Date.now()}-usage-chart.svg`;
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.CHART_BUCKET_NAME,
            Key: s3Key,
            Body: svgChart,
            ContentType: 'image/svg+xml'
        }));
        
        const presignedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
            Bucket: process.env.CHART_BUCKET_NAME,
            Key: s3Key
        }), { expiresIn: 7 * 24 * 60 * 60 });
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chartUrl: presignedUrl })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function getUsageData(startDate, endDate) {
    const dailyUsage = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        
        const params = {
            TableName: process.env.AUDIT_TABLE_NAME,
            KeyConditionExpression: 'audit_date = :date',
            ExpressionAttributeValues: {
                ':date': { S: dateStr }
            }
        };
        
        const result = await dynamoClient.send(new QueryCommand(params));
        
        let dayUsage = 0;
        result.Items?.forEach(item => {
            const delta = parseInt(item.quantity_delta?.S || '0');
            if (delta < 0) {
                dayUsage += Math.abs(delta);
            }
        });
        
        dailyUsage[dateStr] = dayUsage;
    }
    
    return dailyUsage;
}

function generateSVGChart(usageData) {
    const dates = Object.keys(usageData).sort();
    const values = dates.map(date => usageData[date]);
    const maxValue = Math.max(...values) || 1;
    
    const width = 800;
    const height = 600;
    const margin = { top: 60, right: 40, bottom: 80, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    const barWidth = chartWidth / dates.length * 0.8;
    const barSpacing = chartWidth / dates.length;
    
    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" style="background: white;">`;
    
    // Title
    svg += `<text x="${width/2}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">Daily Medication Usage</text>`;
    
    // Y-axis
    svg += `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}" stroke="#374151" stroke-width="2"/>`;
    
    // X-axis
    svg += `<line x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}" stroke="#374151" stroke-width="2"/>`;
    
    // Y-axis label
    svg += `<text x="20" y="${height/2}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1f2937" transform="rotate(-90, 20, ${height/2})">Quantity Used</text>`;
    
    // X-axis label
    svg += `<text x="${width/2}" y="${height - 10}" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#1f2937">Date</text>`;
    
    // Bars and labels
    dates.forEach((date, i) => {
        const value = values[i];
        const barHeight = (value / maxValue) * chartHeight;
        const x = margin.left + i * barSpacing + (barSpacing - barWidth) / 2;
        const y = height - margin.bottom - barHeight;
        
        // Bar
        svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#2563eb" stroke="#1d4ed8" stroke-width="1"/>`;
        
        // Value label on top of bar
        if (value > 0) {
            svg += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#1f2937">${value}</text>`;
        }
        
        // Date label
        const shortDate = date.split('-').slice(1).join('/');
        svg += `<text x="${x + barWidth/2}" y="${height - margin.bottom + 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="11" fill="#1f2937">${shortDate}</text>`;
    });
    
    // Y-axis ticks
    for (let i = 0; i <= 5; i++) {
        const tickValue = Math.round((maxValue / 5) * i);
        const y = height - margin.bottom - (i / 5) * chartHeight;
        svg += `<line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" stroke="#374151" stroke-width="1"/>`;
        svg += `<text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" font-family="Arial, sans-serif" font-size="11" fill="#1f2937">${tickValue}</text>`;
    }
    
    svg += '</svg>';
    return svg;
}
