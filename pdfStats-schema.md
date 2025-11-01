# PDFViewModel Schema

## API Endpoint
`GET /api/Recordings/pdfStats/{recordingId}`

## Response Structure

### PDFViewModel
- `speedHeartRate`: SpeedHeartRateViewModel (nullable)
- `intervals`: IntervalStatsViewModel (nullable)
- `preWorkTime`: number (double)
- `preWorkoutDistance`: PreWorkoutDistance

### SpeedHeartRateViewModel
- `speedHeartRateChart`: array of SpeedHeartRatePoint (nullable)
- `maxHR`: integer (max heart rate)
- `hR13Point3`: integer (HR at 13.3 m/s)
- `bpM200Speed`: number (speed at 200 BPM)
- `maxBPMSpeed`: number (speed at max BPM)
- `heartRateRecovery`: HeartRateRecovery (nullable)

### Key Metrics for Horse Racing
1. **Speed vs Heart Rate Chart** - Shows relationship between speed and heart rate
2. **Max Heart Rate** - Peak cardiovascular performance
3. **HR at 13.3 m/s** - Heart rate at specific speed threshold
4. **Speed at 200 BPM** - Speed achieved at 200 beats per minute
5. **Max BPM Speed** - Speed at maximum heart rate
6. **Heart Rate Recovery** - How quickly heart rate returns to normal
7. **Intervals** - Performance during different workout intervals
8. **Pre-workout metrics** - Warm-up time and distance

## Visualization Strategy
1. **Line Chart**: Speed vs Heart Rate over time/distance
2. **Bar Chart**: Interval statistics
3. **Gauge/Indicator**: Max HR, Recovery metrics
4. **Table**: Detailed statistics and thresholds
