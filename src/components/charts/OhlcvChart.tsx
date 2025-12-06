import { useEffect, useRef, useState } from "react";
import {
  createChart,
  IChartApi,
  CandlestickData,
  Time,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  PriceScaleMode,
  CrosshairMode,
} from "lightweight-charts";
import { Card, Spin, Empty, Button, Space, Segmented } from "antd";
import { http } from "../../providers/hydra";

type Timeframe = "H" | "D" | "W" | "M";

interface OhlcvDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface IndicatorDataPoint {
  time: string;
  value: number | null;
}

interface OhlcvChartResponse {
  ticker: string;
  exchange: string;
  timeframe: string;
  data: OhlcvDataPoint[];
  indicators?: Record<string, IndicatorDataPoint[]>;
}

// Indicator configuration
// Supported types: sma, ema, wma, rsi, macd, bbands, stoch, atr, adx
const INDICATORS = [
  { name: "sma200", type: "sma", period: 200 },
  { name: "wma12", type: "wma", period: 12 },
  { name: "atr14", type: "atr", period: 14 },
  { name: "adx14", type: "adx", period: 14 },
];

const INDICATOR_COLORS: Record<string, string> = {
  sma200: "#2962FF", // Blue
  wma12: "#FFFFFF",  // White
  atr14: "#FF9800",  // Orange
  adx14: "#9C27B0",  // Purple
};

// Indicators to display in separate sub-charts (not on main price chart)
const SUB_CHART_INDICATORS = ["atr14", "adx14"];

interface OhlcvChartProps {
  assetId: number | string;
}

interface TooltipData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
}

export const OhlcvChart = ({ assetId }: OhlcvChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const atrChartContainerRef = useRef<HTMLDivElement>(null);
  const adxChartContainerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const atrChartRef = useRef<IChartApi | null>(null);
  const adxChartRef = useRef<IChartApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<OhlcvChartResponse | null>(null);
  const [isLogScale, setIsLogScale] = useState(false);
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [timeframe, setTimeframe] = useState<Timeframe>("D");

  const handleAutoScale = () => {
    if (chartRef.current) {
      chartRef.current.priceScale("right").applyOptions({ autoScale: true });
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleToggleLogScale = () => {
    if (chartRef.current) {
      const newMode = isLogScale ? PriceScaleMode.Normal : PriceScaleMode.Logarithmic;
      chartRef.current.priceScale("right").applyOptions({ mode: newMode });
      setIsLogScale(!isLogScale);
    }
  };

  // Fetch OHLCV data with indicators
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const indicatorsParam = encodeURIComponent(JSON.stringify(INDICATORS));
        const response = await http<OhlcvChartResponse>(
          `/ohlcv_chart?assetId=${assetId}&timeframe=${timeframe}&indicators=${indicatorsParam}`
        );
        setChartData(response.data);
      } catch (err) {
        setError("Failed to load chart data");
        console.error("OHLCV fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assetId, timeframe]);

  // Create and update chart
  useEffect(() => {
    if (!chartContainerRef.current || !chartData?.data?.length) return;

    // Clean up previous charts
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }
    if (atrChartRef.current) {
      atrChartRef.current.remove();
      atrChartRef.current = null;
    }
    if (adxChartRef.current) {
      adxChartRef.current.remove();
      adxChartRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#999",
      },
      grid: {
        vertLines: { color: "#2B2B43" },
        horzLines: { color: "#2B2B43" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 600,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          labelVisible: true,
        },
        horzLine: {
          labelVisible: true,
        },
      },
      rightPriceScale: {
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    // Volume series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 0.85,
        bottom: 0,
      },
    });

    const formattedData: CandlestickData<Time>[] = chartData.data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData = chartData.data.map((d) => ({
      time: d.time as Time,
      value: d.volume,
      color: d.close >= d.open ? "rgba(38, 166, 154, 0.5)" : "rgba(239, 83, 80, 0.5)",
    }));

    candlestickSeries.setData(formattedData);
    volumeSeries.setData(volumeData);

    // Add indicator series (only non-sub-chart indicators)
    if (chartData.indicators) {
      for (const [name, data] of Object.entries(chartData.indicators)) {
        // Skip indicators that go in sub-charts
        if (SUB_CHART_INDICATORS.includes(name)) continue;

        const color = INDICATOR_COLORS[name] || "#888";
        const indicatorSeries = chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });

        const lineData = data
          .filter((d) => d.value !== null)
          .map((d) => ({
            time: d.time as Time,
            value: d.value as number,
          }));

        indicatorSeries.setData(lineData);
      }
    }

    // Center on last 12 months by default
    if (formattedData.length > 0) {
      const lastDataPoint = formattedData[formattedData.length - 1];
      const lastTime = new Date(lastDataPoint.time as string);
      const twelveMonthsAgo = new Date(lastTime);
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      // Find the index closest to 12 months ago
      const twelveMonthsAgoTimestamp = twelveMonthsAgo.getTime();
      let fromIndex = 0;
      for (let i = 0; i < formattedData.length; i++) {
        const dataTime = new Date(formattedData[i].time as string).getTime();
        if (dataTime >= twelveMonthsAgoTimestamp) {
          fromIndex = i;
          break;
        }
      }

      // Set visible range to last 12 months
      chart.timeScale().setVisibleLogicalRange({
        from: fromIndex,
        to: formattedData.length - 1,
      });
    } else {
      chart.timeScale().fitContent();
    }

    // Create sub-chart helper function
    const createSubChart = (
      containerRef: React.RefObject<HTMLDivElement | null>,
      chartRefObj: React.MutableRefObject<IChartApi | null>,
      indicatorName: string,
      color: string,
      label: string
    ) => {
      if (!containerRef.current || !chartData.indicators?.[indicatorName]) return;

      const subChart = createChart(containerRef.current, {
        layout: {
          background: { color: "transparent" },
          textColor: "#999",
        },
        grid: {
          vertLines: { color: "#2B2B43" },
          horzLines: { color: "#2B2B43" },
        },
        width: containerRef.current.clientWidth,
        height: 100,
        timeScale: {
          visible: false,
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            labelVisible: false,
          },
          horzLine: {
            labelVisible: true,
          },
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
      });

      chartRefObj.current = subChart;

      const lineSeries = subChart.addSeries(LineSeries, {
        color,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        title: label,
      });

      const lineData = chartData.indicators[indicatorName]
        .filter((d) => d.value !== null)
        .map((d) => ({
          time: d.time as Time,
          value: d.value as number,
        }));

      lineSeries.setData(lineData);

      // Sync time scales
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) {
          subChart.timeScale().setVisibleLogicalRange(range);
        }
      });

      subChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range) {
          chart.timeScale().setVisibleLogicalRange(range);
        }
      });

      // Set initial range to match main chart
      const mainChartRange = chart.timeScale().getVisibleLogicalRange();
      if (mainChartRange) {
        subChart.timeScale().setVisibleLogicalRange(mainChartRange);
      }
    };

    // Create ATR sub-chart
    createSubChart(atrChartContainerRef, atrChartRef, "atr14", INDICATOR_COLORS.atr14, "ATR(14)");

    // Create ADX sub-chart
    createSubChart(adxChartContainerRef, adxChartRef, "adx14", INDICATOR_COLORS.adx14, "ADX(14)");

    // Crosshair move handler for tooltip
    const dataMap = new Map(chartData.data.map((d) => [d.time, d]));
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setTooltipData(null);
        return;
      }

      const timeStr = param.time as string;
      const data = dataMap.get(timeStr);
      if (data) {
        const change = data.close - data.open;
        const changePercent = (change / data.open) * 100;
        setTooltipData({
          time: timeStr,
          open: data.open,
          high: data.high,
          low: data.low,
          close: data.close,
          volume: data.volume,
          change,
          changePercent,
        });
      }
    });

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
      if (atrChartContainerRef.current && atrChartRef.current) {
        atrChartRef.current.applyOptions({
          width: atrChartContainerRef.current.clientWidth,
        });
      }
      if (adxChartContainerRef.current && adxChartRef.current) {
        adxChartRef.current.applyOptions({
          width: adxChartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (atrChartRef.current) {
        atrChartRef.current.remove();
        atrChartRef.current = null;
      }
      if (adxChartRef.current) {
        adxChartRef.current.remove();
        adxChartRef.current = null;
      }
    };
  }, [chartData]);

  const title = chartData
    ? `${chartData.ticker} - ${chartData.exchange} (${chartData.timeframe})`
    : "Price Chart";

  const extra = (
    <Space>
      <Segmented
        size="small"
        value={timeframe}
        onChange={(value) => setTimeframe(value as Timeframe)}
        options={[
          { label: "H", value: "H" },
          { label: "D", value: "D" },
          { label: "W", value: "W" },
          { label: "M", value: "M" },
        ]}
      />
      {chartData?.data?.length && (
        <>
          <Button size="small" onClick={handleAutoScale}>
            Auto
          </Button>
          <Button size="small" type={isLogScale ? "primary" : "default"} onClick={handleToggleLogScale}>
            Log
          </Button>
        </>
      )}
    </Space>
  );

  return (
    <Card title={title} extra={extra} style={{ marginBottom: 24 }} size="small">
      {loading ? (
        <div style={{ height: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Empty description={error} style={{ height: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} />
      ) : !chartData?.data?.length ? (
        <Empty description="No chart data available" style={{ height: 600, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} />
      ) : (
        <div style={{ position: "relative" }}>
          {tooltipData && (
            <div
              ref={tooltipRef}
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 10,
                background: "rgba(0, 0, 0, 0.75)",
                padding: "8px 12px",
                borderRadius: 4,
                fontSize: 12,
                color: "#fff",
                pointerEvents: "none",
              }}
            >
              <div style={{ marginBottom: 4, fontWeight: 600 }}>{tooltipData.time}</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "2px 12px" }}>
                <span style={{ color: "#999" }}>O:</span>
                <span>{tooltipData.open.toFixed(2)}</span>
                <span style={{ color: "#999" }}>H:</span>
                <span>{tooltipData.high.toFixed(2)}</span>
                <span style={{ color: "#999" }}>L:</span>
                <span>{tooltipData.low.toFixed(2)}</span>
                <span style={{ color: "#999" }}>C:</span>
                <span>{tooltipData.close.toFixed(2)}</span>
                <span style={{ color: "#999" }}>Vol:</span>
                <span>{tooltipData.volume.toLocaleString()}</span>
                <span style={{ color: "#999" }}>Chg:</span>
                <span style={{ color: tooltipData.change >= 0 ? "#26a69a" : "#ef5350" }}>
                  {tooltipData.change >= 0 ? "+" : ""}{tooltipData.change.toFixed(2)} ({tooltipData.changePercent >= 0 ? "+" : ""}{tooltipData.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          )}
          <div ref={chartContainerRef} style={{ height: 600 }} />
          {/* ATR Sub-chart */}
          <div style={{ marginTop: 4, borderTop: "1px solid #2B2B43" }}>
            <div style={{ fontSize: 11, color: INDICATOR_COLORS.atr14, padding: "4px 0 2px 8px" }}>ATR(14)</div>
            <div ref={atrChartContainerRef} style={{ height: 100 }} />
          </div>
          {/* ADX Sub-chart */}
          <div style={{ marginTop: 4, borderTop: "1px solid #2B2B43" }}>
            <div style={{ fontSize: 11, color: INDICATOR_COLORS.adx14, padding: "4px 0 2px 8px" }}>ADX(14)</div>
            <div ref={adxChartContainerRef} style={{ height: 100 }} />
          </div>
        </div>
      )}
    </Card>
  );
};
