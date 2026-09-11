import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import {
  LayoutDashboard,
  Bitcoin,
  TrendingUp,
  Home,
  Wallet,
  ArrowUpRight,
  Menu,
  X,
  Briefcase,
  Trash2,
  RefreshCw,
  Search,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineIcon,
  Info,
  AlertTriangle,
  Zap,
  History,
  Minus,
  Plus,
  CreditCard,
  Activity,
  ArrowRight
} from 'lucide-react';

const COLORS = ['#f97316', '#3b82f6', '#a855f7', '#10b981'];

// --- Mock Data Inicial ---
const DEFAULT_DATA = {
  cripto: [
    { id: 'btc', name: 'Bitcoin', symbol: 'BTC', amount: 0.85, price: 42530.20, purchasePrice: 30000.00, coingeckoId: 'bitcoin' },
    { id: 'eth', name: 'Ethereum', symbol: 'ETH', amount: 5.4, price: 2340.10, purchasePrice: 1500.00, coingeckoId: 'ethereum' },
    { id: 'sol', name: 'Solana', symbol: 'SOL', amount: 120.0, price: 98.50, purchasePrice: 20.00, coingeckoId: 'solana' },
  ],
  acciones: [
    { id: 'aapl', ticker: 'AAPL', name: 'Apple Inc.', amount: 145, price: 185.30, purchasePrice: 120.00, dividend: 0.52 },
    { id: 'msft', ticker: 'MSFT', name: 'Microsoft Corp.', amount: 82, price: 390.20, purchasePrice: 250.00, dividend: 0.75 },
    { id: 'voo', ticker: 'VOO', name: 'Vanguard S&P 500', amount: 210, price: 435.10, purchasePrice: 380.00, dividend: 1.42 },
  ],
  inmuebles: [
    { id: 're1', address: 'Calle Principal 123, Madrid', marketValue: 320000.00, mortgage: 140000.00, rent: 1200 },
    { id: 're2', address: 'Apto Playa, Valencia', marketValue: 180000.00, mortgage: 0.00, rent: 850 },
  ],
  liquidez: [
    { id: 'liq1', entity: 'Banco Santander', type: 'Cuenta Corriente', balance: 15400.00, goal: 20000 },
    { id: 'liq2', entity: 'Revolut', type: 'Cuenta Ahorro', balance: 24000.00, goal: 30000 },
    { id: 'liq3', entity: 'Efectivo', type: 'Fondo Emergencia', balance: 5000.00, goal: 10000 },
  ]
};

const NAV_ITEMS = [
  { id: 'resumen', name: 'Resumen', icon: LayoutDashboard },
  { id: 'analitica', name: 'Analítica', icon: LineIcon },
  { id: 'cripto', name: 'Cripto', icon: Bitcoin },
  { id: 'acciones', name: 'Acciones/Fondos', icon: TrendingUp },
  { id: 'inmuebles', name: 'Inmuebles', icon: Home },
  { id: 'liquidez', name: 'Liquidez', icon: Wallet },
  { id: 'pasivos', name: 'Pasivos / Deudas', icon: CreditCard },
  { id: 'operaciones', name: 'Operaciones', icon: History },
];

const formatCurrencyOriginal = (val: number, currency: string = 'USD') => 
  new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'en-US', { style: 'currency', currency: currency }).format(val);

const getNYCTime = () => {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
};

const isMarketOpen = () => {
  const nycDate = getNYCTime();
  const day = nycDate.getDay(); 
  const hours = nycDate.getHours();
  const minutes = nycDate.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const isOpenDay = day >= 1 && day <= 5;
  const isOpenTime = totalMinutes >= 570 && totalMinutes < 960;
  return isOpenDay && isOpenTime;
};

const isMarketOpenForStock = (stock: any) => {
  if (stock.isClosed !== undefined) return !stock.isClosed;
  if (!stock.ticker) return isMarketOpen();
  
  const isEuro = /\.(PA|MC|L|DE|AS|MI)$/i.test(stock.ticker);
  if (isEuro) {
    const nycDate = getNYCTime();
    const day = nycDate.getDay();
    const totalMinutes = nycDate.getHours() * 60 + nycDate.getMinutes();
    const isOpenDay = day >= 1 && day <= 5;
    const isOpenTime = totalMinutes >= 180 && totalMinutes < 690; // 09:00 - 17:30 CET = 03:00 - 11:30 NYC
    return isOpenDay && isOpenTime;
  }
  return isMarketOpen();
};

const getNextOpeningMessageForStock = (stock: any) => {
  const nycDate = getNYCTime();
  const day = nycDate.getDay();
  const totalMinutes = nycDate.getHours() * 60 + nycDate.getMinutes();

  if (stock && stock.ticker && /\.(PA|MC|L|DE|AS|MI)$/i.test(stock.ticker)) {
    if (day === 0 || day === 6 || (day === 5 && totalMinutes >= 690)) return "Próxima apertura: Lunes 09:00h (CET)";
    if (totalMinutes < 180) return "Apertura hoy: 09:00h (CET)";
    return "Re-apertura: Mañana 09:00h (CET)";
  }

  if (day === 0 || day === 6 || (day === 5 && totalMinutes >= 960)) {
    return "Próxima apertura: Lunes 15:30h (CET)";
  } else if (totalMinutes < 570) {
    return "Apertura hoy: 15:30h (CET)";
  } else {
    return "Re-apertura: Mañana 15:30h (CET)";
  }
};

const getNextOpeningMessage = () => getNextOpeningMessageForStock(null);

  
const PriceCell = ({ price, currency = 'USD' }: { price: number, currency?: string }) => {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const prevPriceRef = React.useRef(price);

  useEffect(() => {
    if (price > prevPriceRef.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 2000);
      return () => clearTimeout(timer);
    } else if (price < prevPriceRef.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 2000);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = price;
  }, [price]);

  return (
    <span className={`inline-block transition-all duration-700 ${
      flash === 'up' ? 'text-emerald-400 font-bold translate-x-[-2px]' : 
      flash === 'down' ? 'text-rose-400 font-bold translate-x-[-2px]' : 
      'text-slate-300'
    }`}>
      {formatCurrencyOriginal(price, currency)}
    </span>
  );
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileAssetsMenuOpen, setIsMobileAssetsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('resumen');

  // Estado Global Persistente
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem('quantumCapData');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.transacciones) parsed.transacciones = [];
        if (!parsed.pasivos) parsed.pasivos = [];
        return parsed;
      } catch (e) {
        console.error("Error parsing local data", e);
        return { ...DEFAULT_DATA, transacciones: [], pasivos: [] };
      }
    }
    return { ...DEFAULT_DATA, transacciones: [], pasivos: [] };
  });

  // Guardar en localStorage cada vez que los datos cambien
  useEffect(() => {
    localStorage.setItem('quantumCapData', JSON.stringify(data));
  }, [data]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<string | null>(null);
  const [modalError, setModalError] = useState('');
  const [transactionAsset, setTransactionAsset] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null);
  const [quickBreakdownTab, setQuickBreakdownTab] = useState<string | null>(null);

  // Global Multi-currency State
  const [baseCurrency, setBaseCurrency] = useState(() => localStorage.getItem('quantumCapCurrency') || 'USD');
  const [usdEurRate, setUsdEurRate] = useState(0.92);

  useEffect(() => {
    localStorage.setItem('quantumCapCurrency', baseCurrency);
  }, [baseCurrency]);

  useEffect(() => {
    fetch('https://api.exchangerate-api.com/v4/latest/USD')
      .then(res => res.json())
      .then(d => setUsdEurRate(d.rates.EUR))
      .catch(() => setUsdEurRate(0.92));
  }, []);

  const convertUsdToCurrent = (val: number) => baseCurrency === 'EUR' ? val * usdEurRate : val;
  const convertEurToCurrent = (val: number) => baseCurrency === 'USD' ? val / usdEurRate : val;

  const formatCurrency = (val: number, isUSDAsset: boolean | null = null) => {
    let finalVal = val;
    if (isUSDAsset === true) finalVal = convertUsdToCurrent(val);
    else if (isUSDAsset === false) finalVal = convertEurToCurrent(val);
    return formatCurrencyOriginal(finalVal, baseCurrency);
  };

  // --- Cálculos Automáticos ---
  const cryptoTotal = convertUsdToCurrent(data.cripto.reduce((acc: number, curr: any) => acc + (curr.amount * curr.price), 0));
  const stocksTotal = convertUsdToCurrent(data.acciones.reduce((acc: number, curr: any) => acc + (curr.amount * curr.price), 0));
  const stocksCostBasis = convertUsdToCurrent(data.acciones.reduce((acc: number, curr: any) => acc + (curr.amount * (curr.purchasePrice || curr.price)), 0)); //purchasePrice fallback
  const cryptoCostBasis = convertUsdToCurrent(data.cripto.reduce((acc: number, curr: any) => acc + (curr.amount * (curr.purchasePrice || curr.price)), 0));

  
  const realEstateGross = convertEurToCurrent(data.inmuebles.reduce((acc: number, curr: any) => acc + curr.marketValue, 0));
  const realEstateNet = convertEurToCurrent(data.inmuebles.reduce((acc: number, curr: any) => acc + (curr.marketValue - curr.mortgage), 0));
  const liquidityTotal = convertEurToCurrent(data.liquidez.reduce((acc: number, curr: any) => acc + curr.balance, 0));

  const mortgagesTotal = convertEurToCurrent(data.inmuebles.reduce((acc: number, curr: any) => acc + (curr.mortgage || 0), 0));
  const manualLiabilitiesTotal = convertEurToCurrent((data.pasivos || []).reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0));
  const totalLiabilities = mortgagesTotal + manualLiabilitiesTotal;

  // Patrimonio Neto Total = (Activos) - (Deudas Manuales + Hipotecas ya restadas en realEstateNet)
  const totalNetWorth = cryptoTotal + stocksTotal + realEstateNet + liquidityTotal - manualLiabilitiesTotal;

  // Top Activos Calculados
  const getAllAssets = () => {
    const all = [
      ...data.cripto.map((c: any) => ({ 
        id: c.id, name: `${c.name} (${c.symbol})`, category: 'Cripto', value: convertUsdToCurrent(c.amount * c.price), isPositive: true 
      })),
      ...data.acciones.map((a: any) => ({ 
        id: a.id, name: `${a.name} (${a.ticker})`, category: 'Acción/ETF', value: convertUsdToCurrent(a.amount * a.price), isPositive: true 
      })),
      ...data.inmuebles.map((r: any) => ({ 
        id: r.id, name: r.address, category: 'Inmueble', value: convertEurToCurrent(r.marketValue), isPositive: true 
      })),
      ...data.liquidez.map((l: any) => ({ 
        id: l.id, name: l.entity, category: 'Liquidez', value: convertEurToCurrent(l.balance), isPositive: true 
      }))
    ];
    
    // Sort descendente por valor
    all.sort((a, b) => b.value - a.value);
    
    return all.slice(0, 5).map(asset => ({
      ...asset,
      weight: totalNetWorth > 0 ? ((asset.value / totalNetWorth) * 100).toFixed(1) + '%' : '0%',
      trend: '+0.0%' // Mock de trend ya que no tenemos datos históricos
    }));
  };
  const topAssets = getAllAssets();

  // Cards de resumen general
  const ASSET_CARDS = [
    { tab: 'cripto', title: 'Cripto', value: formatCurrency(cryptoTotal), change: '+3.2%', isPositive: true, icon: Bitcoin, colorHover: 'hover:border-orange-500/50 hover:shadow-[0_0_15px_rgba(249,115,22,0.15)]' },
    { tab: 'acciones', title: 'Acciones / ETFs', value: formatCurrency(stocksTotal), change: '+8.4%', isPositive: true, icon: TrendingUp, colorHover: 'hover:border-blue-500/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]' },
    { tab: 'inmuebles', title: 'Inmuebles (Neto)', value: formatCurrency(realEstateNet), change: '+$1,850', isPositive: true, icon: Home, colorHover: 'hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]' },
    { tab: 'liquidez', title: 'Liquidez', value: formatCurrency(liquidityTotal), change: '-1.5%', isPositive: false, icon: Wallet, colorHover: 'hover:border-emerald-500/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)]' },
  ];

  // --- Handlers ---
  const handleOpenModal = (type: string) => {
    setModalType(type);
    setFormData({}); // Limpiar formulario
    setIsModalOpen(true);
  };

  const handleOpenBuyMore = (category: string, asset: any) => {
    setTransactionAsset({ ...asset, category });
    setModalType('buy_more');
    setFormData({ amount: '', price: asset.price || '' });
    setIsModalOpen(true);
  };

  const handleOpenSell = (category: string, asset: any) => {
    setTransactionAsset({ ...asset, category });
    setModalType('sell');
    setFormData({ amount: '', price: asset.price || '' });
    setIsModalOpen(true);
  };

  const handleOpenDividend = (category: string, asset: any) => {
    setTransactionAsset({ ...asset, category });
    setModalType('dividend');
    setFormData({ amount: '', liquidityId: data.liquidez[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleOpenRent = (asset: any) => {
    setTransactionAsset(asset);
    setModalType('rent_in');
    setFormData({ amount: asset.rent || '', liquidityId: data.liquidez[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleOpenMortgagePayment = (asset: any) => {
    setTransactionAsset(asset);
    setModalType('mortgage_out');
    setFormData({ amount: asset.quota || '', liquidityId: data.liquidez[0]?.id || '' });
    setIsModalOpen(true);
  };

  const handleOpenLiquidezTx = (asset: any, txType: 'add' | 'withdraw') => {
    setTransactionAsset({ ...asset, category: 'Liquidez' });
    setModalType(txType === 'add' ? 'liquidez_add' : 'liquidez_withdraw');
    setFormData({ amount: '', concept: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalType(null);
    setModalError('');
    setTransactionAsset(null);
    setStockSearchQuery('');
    setStockSearchResults([]);
  };

  const [isFetchingPrices, setIsFetchingPrices] = useState(false);
  const [isFetchingStocks, setIsFetchingStocks] = useState(false);
  const [apiWarning, setApiWarning] = useState<string | null>(null);
  const [lastFetchSuccess, setLastFetchSuccess] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Analytics Selection
  const [selectedRange, setSelectedRange] = useState('30D');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);

  // Form search state for stocks
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [stockSearchResults, setStockSearchResults] = useState<any[]>([]);
  const [isSearchingStock, setIsSearchingStock] = useState(false);
  
  const [txTimeFilter, setTxTimeFilter] = useState('1m');
  const [txCustomStartDate, setTxCustomStartDate] = useState('');
  const [txCustomEndDate, setTxCustomEndDate] = useState('');
  const [txCategoryFilter, setTxCategoryFilter] = useState('all');

  useEffect(() => {
    if (activeSection === 'operaciones') {
      setTxTimeFilter('1m');
      setTxCategoryFilter('all');
    }
  }, [activeSection]);

  useEffect(() => {
    if (!stockSearchQuery) {
      setStockSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearchingStock(true);
      setApiWarning(null);
      try {
        const res = await fetch(`/api/yahoo/search?q=${stockSearchQuery}`);
        const resData = await res.json();
        
        if (resData && resData.quotes && Array.isArray(resData.quotes)) {
          const mappedData = resData.quotes.map((item: any) => ({
             ticker: item.symbol,
             name: item.shortname || item.longname,
             assetType: item.quoteType || 'Stock'
          }));
          setStockSearchResults(mappedData);
        }
      } catch (error) {
        console.error('Error in Yahoo Search:', error);
        setApiWarning('Error de conexión con el servidor de búsqueda.');
      } finally {
        setIsSearchingStock(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [stockSearchQuery]);

  const dataRef = React.useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const fetchStockPrices = async () => {
    const currentAcciones = dataRef.current.acciones;
    if (currentAcciones.length === 0) return;
    setIsFetchingStocks(true);
    setApiWarning(null);

    // Borramos precio visualmente y ponemos "Cargando..."
    setData((prev: any) => ({
      ...prev,
      acciones: prev.acciones.map((s: any) => ({ ...s, isLoadingPrice: true }))
    }));

    let anyErrors = false;
    let errorMessage = '';

    try {
      const updatedAcciones = [];

      for (let i = 0; i < currentAcciones.length; i++) {
        const stock = currentAcciones[i];
        if (!stock.ticker) {
          updatedAcciones.push({ ...stock, isLoadingPrice: false });
          continue;
        }
        
        try {
          const res = await fetch(`/api/yahoo/chart?ticker=${stock.ticker.toUpperCase()}`);
          const apiData = await res.json();

          const price = apiData?.chart?.result?.[0]?.meta?.regularMarketPrice;
          const marketState = apiData?.chart?.result?.[0]?.meta?.marketState;

          let isClosed;
          if (marketState) {
            isClosed = marketState !== 'REGULAR';
          } else {
            isClosed = !isMarketOpenForStock({ ticker: stock.ticker, isClosed: undefined });
          }

          if (price !== undefined && price !== null) {
            updatedAcciones.push({
              ...stock,
              price: Number(price),
              updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isClosed,
              fetchFailed: false,
              apiWarning: undefined,
              isLoadingPrice: false
            });
          } else {
            updatedAcciones.push({ ...stock, fetchFailed: true, apiWarning: 'Hubo un error o el ticker no existe en Yahoo.', isLoadingPrice: false });
          }
        } catch (e) {
          console.error(`Error fetching for ${stock.ticker}:`, e);
          anyErrors = true;
          errorMessage = "Error de conexión";
          updatedAcciones.push({ ...stock, fetchFailed: true, apiWarning: errorMessage, isLoadingPrice: false });
        }
      }

      if (anyErrors && errorMessage) {
        setApiWarning(errorMessage);
      }

      if (updatedAcciones.length > 0) {
        setLastFetchSuccess(true);
        setLastUpdated(Date.now());
        setData((prev: any) => ({ ...prev, acciones: updatedAcciones }));
      }
    } catch (e) {
      console.error('Error in fetchStockPrices:', e);
      setApiWarning('Error general al conectar con Yahoo Finance.');
      setData((prev: any) => ({
        ...prev,
        acciones: prev.acciones.map((s: any) => ({ ...s, fetchFailed: true, isLoadingPrice: false }))
      }));
    } finally {
      setIsFetchingStocks(false);
    }
  };

  const fetchPrices = async () => {
    setIsFetchingPrices(true);
    try {
      const cryptoIds = dataRef.current.cripto.map((c: any) => c.coingeckoId || c.name.toLowerCase()).join(',');
      if (!cryptoIds) {
        setIsFetchingPrices(false);
        return;
      }
      const res = await fetch(`/api/crypto/prices?ids=${cryptoIds}`);
      if (!res.ok) throw new Error('API request failed');
      const apiData = await res.json();
      
      setData((prev: any) => {
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newCripto = prev.cripto.map((c: any) => {
          const idToSearch = c.coingeckoId || c.name.toLowerCase();
          const apiPrice = apiData[idToSearch]?.usd;
          if (apiPrice) {
            return { ...c, price: apiPrice, updatedAt: timestamp };
          }
          return c; 
        });
        setLastFetchSuccess(true);
        setLastUpdated(Date.now());
        return { ...prev, cripto: newCripto };
      });
    } catch (error) {
      console.error('Error fetching prices from CoinGecko:', error);
    } finally {
      setIsFetchingPrices(false);
    }
  };

  const forceRefresh = () => {
    setLastFetchSuccess(false);
    fetchPrices();
    fetchStockPrices();
  };

  const fetchHistory = async () => {
    if (topAssets.length === 0) return;
    const topAsset = topAssets[0];
    setIsFetchingHistory(true);
    
    try {
      if (topAsset.category === 'Cripto') {
        const crypto = data.cripto.find((c: any) => `${c.name} (${c.symbol})` === topAsset.name);
        const daysMap: any = { '1D': 1, '7D': 7, '30D': 30, '90D': 90, '6M': 180, '1Y': 365, 'TOTAL': 'max' };
        const id = crypto?.coingeckoId || crypto?.name.toLowerCase();
        const res = await fetch(`/api/crypto/market_chart?id=${id}&days=${daysMap[selectedRange]}`);
        const apiData = await res.json();
        if (apiData.prices) {
          setHistoricalData(apiData.prices.map((p: any) => ({
            date: new Date(p[0]).toLocaleDateString([], { month: 'short', day: 'numeric' }),
            price: p[1]
          })));
        }
      } else if (topAsset.category === 'Acción/ETF') {
        const stock = data.acciones.find((a: any) => `${a.name} (${a.ticker})` === topAsset.name);
        const dateMap: any = {
          '1D': '1d', '7D': '5d', '30D': '1mo', '90D': '3mo', '6M': '6mo', '1Y': '1y', 'TOTAL': 'max'
        };
        const range = dateMap[selectedRange] || '1mo';
        const res = await fetch(`/api/yahoo/chart?ticker=${stock.ticker}&range=${range}&interval=1d`);
        const apiData = await res.json();
        const result = apiData?.chart?.result?.[0];
        
        if (result && result.timestamp && result.indicators?.quote?.[0]?.close) {
          const timestamps = result.timestamp;
          const closes = result.indicators.quote[0].close;
          const points = [];
          
          for (let i = 0; i < timestamps.length; i++) {
             if (closes[i] !== null && closes[i] !== undefined) {
               points.push({
                 date: new Date(timestamps[i] * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' }),
                 price: closes[i]
               });
             }
          }
          setHistoricalData(points);
        }
      } else {
        // Mock for RE/Liquidity
        const mockData = Array.from({ length: 20 }).map((_, i) => ({
          date: `Día ${i+1}`,
          price: topAsset.value * (1 + (Math.random() * 0.05 - 0.025))
        }));
        setHistoricalData(mockData);
      }
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setIsFetchingHistory(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'analitica') {
        fetchHistory();
    }
  }, [activeSection, selectedRange, topAssets.length]);

  useEffect(() => {
    const checkStaleData = () => {
      const saved = localStorage.getItem('quantumCapLastRefresh');
      const lastRefresh = saved ? parseInt(saved) : 0;
      const now = Date.now();
      const ageInSeconds = (now - lastRefresh) / 1000;

      if (isMarketOpen() && ageInSeconds > 60) {
        console.log("Market is open and data is older than 60s. Refreshing...");
        forceRefresh();
      } else if (!saved) {
        forceRefresh();
      }
    };

    checkStaleData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update last refresh timestamp when fetch succeeds
  useEffect(() => {
    if (lastFetchSuccess) {
      localStorage.setItem('quantumCapLastRefresh', Date.now().toString());
    }
  }, [lastFetchSuccess]);

  const handleDelete = (category: string, id: string) => {
    setData((prev: any) => ({
      ...prev,
      [category]: prev[category].filter((item: any) => item.id !== id)
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalType) return;

    if (modalType === 'liquidez_add' || modalType === 'liquidez_withdraw') {
      const isAdd = modalType === 'liquidez_add';
      const parsedAmount = Number(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return;

      if (!isAdd) {
        const itemToWithdraw = data.liquidez.find((i: any) => i.id === transactionAsset.id);
        if (itemToWithdraw && parsedAmount > itemToWithdraw.balance) {
          setModalError('Fondos insuficientes en la cuenta seleccionada. Por favor, ajusta el importe o cambia de cuenta.');
          return; // Early return prevents UI closing
        }
      }

      setData((prev: any) => {
        const items = [...(prev.liquidez || [])];
        const idx = items.findIndex((i: any) => i.id === transactionAsset.id);
        if (idx === -1) return prev;

        const asset = items[idx];
        const newBalance = isAdd ? asset.balance + parsedAmount : asset.balance - parsedAmount;
        items[idx] = { ...asset, balance: newBalance };

        const newTransacciones = [...(prev.transacciones || [])];
        newTransacciones.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: isAdd ? 'liquidez_in' : 'liquidez_out',
          assetId: asset.id,
          assetName: asset.entity,
          ticker: 'Efectivo',
          amount: 1, // Conceptually 1 chunk of operation
          price: parsedAmount,
          total: parsedAmount,
          concept: formData.concept || (isAdd ? 'Ingreso' : 'Retirada'),
          pnl: 0
        });

        return { ...prev, liquidez: items, transacciones: newTransacciones };
      });
      handleCloseModal();
      return;
    }

    if (modalType === 'dividend' || modalType === 'rent_in' || modalType === 'mortgage_out') {
      const parsedAmount = Number(formData.amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return;

      if (modalType === 'mortgage_out') {
        const liqAccId = formData.liquidityId || (data.liquidez[0] ? data.liquidez[0].id : null);
        if (!liqAccId) {
          setModalError('No hay cuentas de liquidez disponibles para realizar el pago.');
          return;
        }
        const liqAcc = data.liquidez.find((l: any) => l.id === liqAccId);
        if (liqAcc && parsedAmount > liqAcc.balance) {
          setModalError('Fondos insuficientes en la cuenta seleccionada. Por favor, ajusta el importe o cambia de cuenta.');
          return; // Prevents closing the modal
        }
      }

      setData((prev: any) => {
        let newLiquidez = [...prev.liquidez];
        let newPasivos = [...(prev.pasivos || [])];
        const liquidezIndex = newLiquidez.findIndex(l => l.id === formData.liquidityId);
        if (liquidezIndex === -1 && newLiquidez.length > 0) {
           // fallback to first if selecting failed but array not empty
        }
        const targetLiqIdx = liquidezIndex !== -1 ? liquidezIndex : 0;

        if (newLiquidez.length > 0) {
          if (modalType === 'mortgage_out') {
             newLiquidez[targetLiqIdx].balance -= parsedAmount;
          } else {
             newLiquidez[targetLiqIdx].balance += parsedAmount;
          }
        }

        let newInmuebles = [...prev.inmuebles];
        if (modalType === 'mortgage_out') {
          const inmIndex = newInmuebles.findIndex(i => i.id === transactionAsset.id);
          if (inmIndex !== -1) {
            newInmuebles[inmIndex] = { ...newInmuebles[inmIndex], mortgage: Math.max(0, newInmuebles[inmIndex].mortgage - parsedAmount) };
            
            // Also update the pasivos array if it's there
            const pasivoIndex = newPasivos.findIndex(p => p.id === transactionAsset.id + '_mortgage');
            if (pasivoIndex !== -1) {
               newPasivos[pasivoIndex] = { ...newPasivos[pasivoIndex], amount: Math.max(0, newPasivos[pasivoIndex].amount - parsedAmount) };
            }
          }
        }

        const newTransacciones = [...(prev.transacciones || [])];
        newTransacciones.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: modalType === 'dividend' ? 'dividend' : modalType === 'rent_in' ? 'rent_in' : 'mortgage_out',
          assetId: transactionAsset.id,
          assetName: transactionAsset.name || transactionAsset.address,
          ticker: transactionAsset.ticker || transactionAsset.symbol || transactionAsset.coingeckoId || (modalType === 'rent_in' ? 'Alquiler' : 'Hipoteca'),
          amount: 0,
          price: 0,
          total: parsedAmount,
          pnl: modalType === 'mortgage_out' ? -parsedAmount : parsedAmount // Or just 0
        });

        return { ...prev, liquidez: newLiquidez, transacciones: newTransacciones, inmuebles: newInmuebles, pasivos: newPasivos };
      });
      handleCloseModal();
      return;
    }

    if (modalType === 'buy_more' || modalType === 'sell') {
      const isBuy = modalType === 'buy_more';
      const parsedAmount = Number(formData.amount);
      const parsedPrice = Number(formData.price);
      const fee = Number(formData.fee) || 0;
      if (isNaN(parsedAmount) || parsedAmount <= 0) return;
      if (isNaN(parsedPrice) || parsedPrice < 0) return;

      const cat = transactionAsset.category;
      
      setData((prev: any) => {
        const items = [...(prev[cat] || [])];
        const idx = items.findIndex((i: any) => i.id === transactionAsset.id);
        if (idx === -1) return prev;

        const asset = items[idx];
        const totalValue = parsedAmount * parsedPrice;
        const totalLiquidityImpact = isBuy ? totalValue + fee : totalValue - fee;

        let newLiquidez = [...prev.liquidez];
        let newPasivos = [...(prev.pasivos || [])];
        if (isBuy) {
          if (newLiquidez.length > 0) {
             if (newLiquidez[0].balance < totalLiquidityImpact) {
               const debt = totalLiquidityImpact - newLiquidez[0].balance;
               newLiquidez[0].balance = 0;
               newPasivos.push({
                 id: Date.now().toString() + '_margin_buy',
                 name: `Préstamo de Margen (${asset.name})`,
                 entity: 'Bróker',
                 amount: debt
               });
             } else {
               newLiquidez[0].balance -= totalLiquidityImpact;
             }
          } else {
             newPasivos.push({
               id: Date.now().toString() + '_margin_buy',
               name: `Préstamo de Margen (${asset.name})`,
               entity: 'Bróker',
               amount: totalLiquidityImpact
             });
          }
        } else {
          if (parsedAmount > asset.amount) return prev; // Cannot sell more than owned
          if (newLiquidez.length > 0) {
             newLiquidez[0].balance += totalLiquidityImpact;
          }
        }

        const newTransacciones = [...(prev.transacciones || [])];
        newTransacciones.unshift({
          id: Date.now().toString(),
          date: new Date().toISOString(),
          type: isBuy ? 'buy' : 'sell',
          assetId: asset.id,
          assetName: asset.name,
          ticker: asset.ticker || asset.symbol || asset.coingeckoId || 'Unknown',
          amount: parsedAmount,
          price: parsedPrice,
          fee: fee,
          total: totalValue,
          pnl: !isBuy ? (parsedPrice - (asset.purchasePrice || asset.price || 0)) * parsedAmount - fee : 0
        });

        if (isBuy) {
          const currentQty = asset.amount || 0;
          const currentBuyPrice = asset.purchasePrice || asset.price || 0;
          const totalCost = (currentQty * currentBuyPrice) + totalValue + fee;
          const newQty = currentQty + parsedAmount;
          
          items[idx] = {
            ...asset,
            amount: newQty,
            purchasePrice: totalCost / newQty
          };
        } else {
          const newQty = asset.amount - parsedAmount;
          if (newQty <= 0) {
            items.splice(idx, 1);
          } else {
            items[idx] = { ...asset, amount: newQty };
          }
        }

        return { ...prev, [cat]: items, liquidez: newLiquidez, transacciones: newTransacciones, pasivos: newPasivos };
      });

      handleCloseModal();
      return;
    }

    let newItem = {
      id: Date.now().toString(),
      type: modalType === 'cripto' ? 'crypto' : modalType === 'acciones' ? 'stock' : modalType,
      ...formData
    };

    if (modalType === 'acciones') {
      if (newItem.ticker) {
        newItem.ticker = newItem.ticker.trim().toUpperCase();
      }
      if (!newItem.purchasePrice) {
        newItem.purchasePrice = Number(formData.price || 0);
      }
      newItem.price = 0;
      newItem.updatedAt = 'Pendiente';
      newItem.fetchFailed = false;
    } else if (modalType === 'cripto') {
      if (!newItem.purchasePrice) {
        newItem.purchasePrice = Number(formData.price || 0);
      }
      newItem.price = 0;
      newItem.updatedAt = 'Pendiente';
    }

    setData((prev: any) => {
      const cat = modalType;
      let newLiquidez = [...prev.liquidez];
      let newPasivos = [...(prev.pasivos || [])];
      let newTransacciones = [...(prev.transacciones || [])];
      
      const parsedAmount = Number(newItem.amount || 0);
      const fee = Number(formData.fee) || 0;
      
      let parsedPrice = Number(newItem.purchasePrice || 0);
      const totalValue = parsedAmount * parsedPrice;
      const totalCost = totalValue + fee;
      
      if (parsedAmount > 0) {
        newItem.purchasePrice = totalCost / parsedAmount;
      }
      
      if (['acciones', 'cripto'].includes(cat) && totalCost > 0) {
         if (newLiquidez.length > 0) {
             if (newLiquidez[0].balance < totalCost) {
               const debt = totalCost - newLiquidez[0].balance;
               newLiquidez[0].balance = 0;
               newPasivos.push({
                 id: Date.now().toString() + '_margin_new',
                 name: `Préstamo de Margen (${newItem.name})`,
                 entity: 'Bróker',
                 amount: debt
               });
             } else {
               newLiquidez[0].balance -= totalCost;
             }
         } else {
             newPasivos.push({
               id: Date.now().toString() + '_margin_new',
               name: `Préstamo de Margen (${newItem.name})`,
               entity: 'Bróker',
               amount: totalCost
             });
         }
          
         newTransacciones.unshift({
           id: Date.now().toString(),
           date: new Date().toISOString(),
           type: 'buy',
           assetId: newItem.id,
           assetName: newItem.name,
           ticker: newItem.ticker || newItem.symbol || newItem.coingeckoId || 'Unknown',
           amount: parsedAmount,
           price: parsedPrice,
           fee: fee,
           total: totalValue,
           pnl: 0
         });
         
         return {
           ...prev,
           [cat]: [...prev[cat], newItem],
           liquidez: newLiquidez,
           transacciones: newTransacciones,
           pasivos: newPasivos
         };
      }

      return {
        ...prev,
        [modalType]: [...prev[modalType], newItem],
        pasivos: newPasivos
      };
    });

    handleCloseModal();
    
    // Attempt immediate fetch
    if (modalType === 'acciones') {
      setTimeout(fetchStockPrices, 100);
    } else if (modalType === 'cripto') {
      setTimeout(fetchPrices, 100);
    }
  };

  const renderModalInputs = () => {
    let focusColor = 'focus:border-slate-500';
    if (modalType?.includes('cripto') || ['buy_more', 'sell', 'dividend'].includes(modalType || '') && transactionAsset?.category === 'Cripto') focusColor = 'focus:border-orange-500';
    else if (modalType?.includes('acciones') || ['buy_more', 'sell', 'dividend'].includes(modalType || '') && transactionAsset?.category === 'Acción/ETF') focusColor = 'focus:border-blue-500';
    else if (modalType?.includes('inmuebles')) focusColor = 'focus:border-purple-500';
    else if (modalType?.includes('liquidez')) focusColor = 'focus:border-emerald-500';
    else if (modalType?.includes('pasivos')) focusColor = 'focus:border-red-500';
    
    const inputClass = `w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none ${focusColor} transition-colors`;
    
    switch (modalType) {
      case 'cripto':
        return (
          <>
            <input required value={formData.coingeckoId || ''} onChange={e => setFormData({...formData, coingeckoId: e.target.value.toLowerCase()})} placeholder="ID de CoinGecko (ej. bitcoin)" className={inputClass}/>
            <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre (ej. Bitcoin)" className={inputClass}/>
            <input required value={formData.symbol || ''} onChange={e => setFormData({...formData, symbol: e.target.value})} placeholder="Símbolo (ej. BTC)" className={inputClass}/>
            <input required type="number" step="any" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="Cantidad (ej. 0.5)" className={inputClass}/>
            <input required type="number" step="any" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="Precio de compra manual ($)" className={inputClass}/>
            <input type="number" step="any" value={formData.fee || ''} onChange={e => setFormData({...formData, fee: Number(e.target.value)})} placeholder="Comisiones / Fees ($) - Opcional" className={inputClass}/>
          </>
        );
      case 'acciones':
        return (
          <>
            <div className="relative mb-4">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Search className="h-5 w-5 text-slate-500" />
               </div>
               <input 
                 value={stockSearchQuery} 
                 onChange={e => setStockSearchQuery(e.target.value)} 
                 placeholder="Buscar por Ticker o Empresa (ej. AAPL)" 
                 className={`${inputClass} pl-10`}
               />
               {isSearchingStock && <span className="absolute right-3 top-3 text-xs text-slate-400 font-medium">Buscando...</span>}
               {stockSearchResults.length > 0 && stockSearchQuery && (
                 <div className="absolute z-10 w-full bg-slate-800 border border-slate-700 rounded-xl mt-2 max-h-48 overflow-y-auto shadow-2xl">
                   {stockSearchResults.map(match => (
                     <div 
                       key={match.ticker} 
                       className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 flex flex-col group"
                       onClick={() => {
                         setFormData({...formData, ticker: match.ticker, name: match.name});
                         setStockSearchQuery('');
                         setStockSearchResults([]);
                       }}
                     >
                       <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">{match.ticker}</span>
                       <span className="text-xs text-slate-400">{match.name} ({match.assetType})</span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
            
            <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre (ej. Apple Inc.)" className={inputClass}/>
            <input value={formData.ticker || ''} onChange={e => setFormData({...formData, ticker: e.target.value})} placeholder="Ticker (ej. AAPL) - Opcional" className={inputClass}/>
            <input required type="number" step="any" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="Cantidad" className={inputClass}/>
            <input type="number" step="any" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} placeholder="Precio de compra ($) - Opcional" className={inputClass}/>
            <input type="number" step="any" value={formData.fee || ''} onChange={e => setFormData({...formData, fee: Number(e.target.value)})} placeholder="Comisiones / Fees ($) - Opcional" className={inputClass}/>
            <input type="number" step="any" value={formData.dividend || ''} onChange={e => setFormData({...formData, dividend: Number(e.target.value)})} placeholder="Dividendo (%) - Opcional" className={inputClass}/>
          </>
        );
      case 'inmuebles':
        return (
          <>
            <input required value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Nombre / Dirección del inmueble" className={inputClass}/>
            <input required type="number" step="any" value={formData.marketValue || ''} onChange={e => setFormData({...formData, marketValue: Number(e.target.value)})} placeholder="Valor actual de mercado ($)" className={inputClass}/>
            <input required type="number" step="any" value={formData.mortgage || ''} onChange={e => setFormData({...formData, mortgage: Number(e.target.value)})} placeholder="Hipoteca pendiente ($) - 0 si no hay" className={inputClass}/>
            <input type="number" step="any" value={formData.quota || ''} onChange={e => setFormData({...formData, quota: Number(e.target.value)})} placeholder="Cuota Hipoteca ($) - Opcional" className={inputClass}/>
            <input type="number" step="any" value={formData.rent || ''} onChange={e => setFormData({...formData, rent: Number(e.target.value)})} placeholder="Renta mensual ($) - Opcional" className={inputClass}/>
          </>
        );
      case 'pasivos':
        return (
          <>
            <input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nombre de la Deuda (ej. Préstamo Personal)" className={inputClass}/>
            <input required value={formData.entity || ''} onChange={e => setFormData({...formData, entity: e.target.value})} placeholder="Entidad (ej. Banco Santander)" className={inputClass}/>
            <input required type="number" step="any" value={formData.amount !== undefined ? formData.amount : ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="Capital Pendiente ($)" className={inputClass}/>
            <input type="number" step="any" value={formData.quota || ''} onChange={e => setFormData({...formData, quota: Number(e.target.value)})} placeholder="Cuota Mensual ($) - Opcional" className={inputClass}/>
          </>
        );
      case 'liquidez':
        return (
          <>
            <input required value={formData.entity || ''} onChange={e => setFormData({...formData, entity: e.target.value})} placeholder="Entidad (ej. Banco Santander)" className={inputClass}/>
            <input required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="Tipo (ej. Cuenta Corriente)" className={inputClass}/>
            <input required type="number" step="any" value={formData.balance || ''} onChange={e => setFormData({...formData, balance: Number(e.target.value)})} placeholder="Balance Actual ($)" className={inputClass}/>
            <input type="number" step="any" value={formData.goal || ''} onChange={e => setFormData({...formData, goal: Number(e.target.value)})} placeholder="Meta de ahorro ($) - Opcional" className={inputClass}/>
          </>
        );
      case 'buy_more':
        return (
          <>
            <input disabled value={transactionAsset?.name || ''} className={`${inputClass} opacity-50 cursor-not-allowed`}/>
            <input disabled value={transactionAsset?.ticker || transactionAsset?.symbol || transactionAsset?.coingeckoId || ''} className={`${inputClass} opacity-50 cursor-not-allowed`}/>
            <input required type="number" step="any" value={formData.amount !== undefined ? formData.amount : ''} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Cantidad a comprar" className={inputClass}/>
            <input required type="number" step="any" value={formData.price !== undefined ? formData.price : ''} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Precio de compra unitario ($)" className={inputClass}/>
            <input type="number" step="any" value={formData.fee !== undefined ? formData.fee : ''} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="Comisiones / Fees ($) - Opcional" className={inputClass}/>
          </>
        );
      case 'sell':
        return (
          <>
            <div className="text-sm text-slate-400 mb-2 font-medium">Disponible para venta: <span className="text-white font-bold">{transactionAsset?.amount}</span></div>
            <input disabled value={transactionAsset?.name || ''} className={`${inputClass} opacity-50 cursor-not-allowed`}/>
            <input required type="number" step="any" max={transactionAsset?.amount || 0} value={formData.amount !== undefined ? formData.amount : ''} onChange={e => setFormData({...formData, amount: e.target.value})} placeholder="Cantidad a vender" className={inputClass}/>
            <input required type="number" step="any" value={formData.price !== undefined ? formData.price : ''} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="Precio de venta unitario ($)" className={inputClass}/>
            <input type="number" step="any" value={formData.fee !== undefined ? formData.fee : ''} onChange={e => setFormData({...formData, fee: e.target.value})} placeholder="Comisiones de Venta ($) - Opcional" className={inputClass}/>
          </>
        );
      case 'liquidez_add':
      case 'liquidez_withdraw':
        return (
          <>
            <input disabled value={transactionAsset?.entity || ''} className={`${inputClass} opacity-50 cursor-not-allowed`}/>
            <input required type="text" value={formData.concept || ''} onChange={e => setFormData({...formData, concept: e.target.value})} placeholder="Concepto (ej. Nómina, Pago)" className={inputClass}/>
            <input required type="number" step="any" value={formData.amount !== undefined ? formData.amount : ''} onChange={e => { setFormData({...formData, amount: e.target.value}); setModalError(''); }} placeholder={modalType === 'liquidez_add' ? "Cantidad a ingresar ($)" : "Cantidad a retirar ($)"} className={inputClass}/>
          </>
        );
      case 'dividend':
      case 'rent_in':
      case 'mortgage_out':
        return (
          <>
            <input disabled value={transactionAsset?.name || transactionAsset?.address || ''} className={`${inputClass} opacity-50 cursor-not-allowed`}/>
            <input required type="number" step="any" value={formData.amount !== undefined ? formData.amount : ''} onChange={e => { setFormData({...formData, amount: e.target.value}); setModalError(''); }} placeholder={modalType === 'mortgage_out' ? "Importe de la cuota ($)" : modalType === 'rent_in' ? "Importe del alquiler ($)" : "Importe Neto Recibido ($)"} className={inputClass}/>
            <select required value={formData.liquidityId || ''} onChange={e => { setFormData({...formData, liquidityId: e.target.value}); setModalError(''); }} className={inputClass}>
              <option value="" disabled>Selecciona cuenta de liquidez</option>
              {data.liquidez.map((liq: any) => (
                <option key={liq.id} value={liq.id}>{liq.entity} ({formatCurrency(liq.balance, false)})</option>
              ))}
            </select>
          </>
        );
      default:
        return null;
    }
  };

  const getSectionTitle = (type: string) => {
    const titles: any = {
      'cripto': 'Criptoactivo',
      'acciones': 'Acción / ETF',
      'inmuebles': 'Propiedad Inmobiliaria',
      'liquidez': 'Cuenta / Liquidez',
      'pasivos': 'Deuda / Pasivo'
    };
    return titles[type] || 'Activo';
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'pasivos':
        const manualPasivos = data.pasivos || [];
        const mortgages = (data.inmuebles || []).filter((i: any) => i.mortgage > 0).map((i: any) => ({
           id: i.id + '_mortgage',
           name: `Hipoteca - ${i.address}`,
           entity: 'Inmuebles',
           amount: i.mortgage,
           isMortgage: true
        }));
        const allPasivos = [...manualPasivos, ...mortgages];
        const totalPasivosAmount = convertEurToCurrent(allPasivos.reduce((acc, curr) => acc + curr.amount, 0));

        return (
          <div className="p-6 lg:p-10 flex-1 flex flex-col animate-in fade-in duration-500 relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Pasivos y Deudas</h2>
                <p className="text-sm text-slate-400">Control de tus obligaciones y préstamos.</p>
              </div>
              <button onClick={() => handleOpenModal('pasivos')} className="bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-red-500/20 shrink-0 relative z-10">
                Añadir Deuda
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <CreditCard className="w-24 h-24" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Deuda Total</h3>
                  <p className="text-3xl font-bold text-rose-500">{formatCurrency(totalPasivosAmount)}</p>
               </div>
               <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Activity className="w-24 h-24" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Impacto en Patrimonio</h3>
                  <p className="text-3xl font-bold text-slate-300">
                    {totalNetWorth > 0 ? `-${((totalPasivosAmount / (totalNetWorth + totalPasivosAmount)) * 100).toFixed(1)}%` : '0%'}
                  </p>
               </div>
            </div>

            <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Nombre</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Entidad</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Cuota</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">Capital Pendiente</th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {allPasivos.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-500 text-sm">No tienes pasivos registrados.</td></tr>
                    ) : (
                      allPasivos.map((pasivo: any) => (
                        <tr key={pasivo.id} className="hover:bg-slate-800/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
                                <CreditCard className="w-4 h-4 text-rose-500" />
                              </div>
                              <span className="font-bold text-white text-sm">{pasivo.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{pasivo.entity}</td>
                          <td className="px-6 py-4 text-right text-sm text-slate-300 font-medium">{pasivo.quota ? formatCurrency(pasivo.quota, false) : '-'}</td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-rose-400">{formatCurrency(pasivo.amount, false)}</td>
                          <td className="px-6 py-4 text-right">
                             {!pasivo.isMortgage && (
                               <button 
                                 onClick={() => handleDelete('pasivos', pasivo.id)}
                                 className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                 title="Liquidar Deuda"
                               >
                                 <Trash2 className="w-4 h-4"/>
                               </button>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
        
      case 'operaciones': {
        const now = new Date();
        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (txTimeFilter === '1w') startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
        else if (txTimeFilter === '1m') startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        else if (txTimeFilter === '3m') startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        else if (txTimeFilter === '6m') startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        else if (txTimeFilter === '1y') startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        else if (txTimeFilter === 'custom') {
           if (txCustomStartDate) startDate = new Date(txCustomStartDate);
           if (txCustomEndDate) {
              endDate = new Date(txCustomEndDate);
              endDate.setHours(23, 59, 59, 999);
           }
        }

        const filteredTransacciones = (data.transacciones || []).filter((tx: any) => {
          const txDate = new Date(tx.date);
          if (startDate && txDate < startDate) return false;
          if (endDate && txDate > endDate) return false;
          
          if (txCategoryFilter !== 'all') {
             if (txCategoryFilter === 'buy' && tx.type !== 'buy') return false;
             if (txCategoryFilter === 'sell' && tx.type !== 'sell') return false;
             if (txCategoryFilter === 'dividend' && tx.type !== 'dividend') return false;
             if (txCategoryFilter === 'income' && !['rent_in', 'liquidez_in'].includes(tx.type)) return false;
             if (txCategoryFilter === 'expense' && !['mortgage_out', 'liquidez_out'].includes(tx.type)) return false;
          }
          return true;
        });

        const sumarioBalanceNeto = filteredTransacciones.reduce((acc: number, tx: any) => {
            const isIncome = ['sell', 'liquidez_in', 'dividend', 'rent_in'].includes(tx.type);
            const isExpense = ['buy', 'liquidez_out', 'mortgage_out'].includes(tx.type);
            
            let cashFlow = 0;
            if (isIncome) cashFlow = tx.total - (tx.fee || 0);
            if (isExpense) cashFlow = -(tx.total + (tx.fee || 0));

            const isUsdTx = ['buy', 'sell', 'dividend'].includes(tx.type);
            const cashFlowConverted = isUsdTx ? convertUsdToCurrent(cashFlow) : convertEurToCurrent(cashFlow);

            return acc + cashFlowConverted;
        }, 0);

        const pillClass = (active: boolean) => `px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${active ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`;
        
        return (
          <div className="p-6 lg:p-10 flex-1 flex flex-col space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Historial de Operaciones</h2>
                <p className="text-sm text-slate-400">Registro de todas las compras y ventas ejecutadas.</p>
              </div>
              <button 
                onClick={() => {
                  const headers = ['Fecha          ', 'Activo', 'Tipo de Operación', 'Cantidad', 'Precio Unitario', 'Comisiones', 'Total Neto'];
                  
                  const rows = filteredTransacciones.map((tx: any) => {
                    const date = new Date(tx.date).toLocaleDateString();
                    const assetName = `"${(tx.assetName || tx.ticker || '').replace(/"/g, '""')}"`;
                    
                    let typeName = '';
                    if (tx.type === 'buy') typeName = 'Compra';
                    else if (tx.type === 'sell') typeName = 'Venta';
                    else if (tx.type === 'dividend') typeName = 'Dividendo';
                    else if (tx.type === 'rent_in') typeName = 'Ingreso (Alquiler)';
                    else if (tx.type === 'liquidez_in') typeName = 'Ingreso (Capital)';
                    else if (tx.type === 'mortgage_out') typeName = 'Gasto (Hipoteca)';
                    else if (tx.type === 'liquidez_out') typeName = 'Retirada (Capital)';
                    else typeName = tx.type;

                    const isUsdTx = ['buy', 'sell', 'dividend'].includes(tx.type);
                    const applyConversion = (val: number) => isUsdTx ? convertUsdToCurrent(val) : convertEurToCurrent(val);

                    const qtyRaw = tx.ticker === 'Efectivo' || tx.type === 'liquidez_in' || tx.type === 'liquidez_out' || tx.type === 'dividend' || tx.type === 'rent_in' || tx.type === 'mortgage_out' ? '-' : tx.amount;
                    const qty = typeof qtyRaw === 'number' ? qtyRaw.toFixed(2).replace('.', ',') : qtyRaw;

                    const priceRaw = tx.ticker === 'Efectivo' || tx.type === 'liquidez_in' || tx.type === 'liquidez_out' || tx.type === 'dividend' || tx.type === 'rent_in' || tx.type === 'mortgage_out' ? '-' : tx.price;
                    const price = typeof priceRaw === 'number' ? applyConversion(priceRaw).toFixed(2).replace('.', ',') : priceRaw;
                    
                    const comisiones = (typeof tx.fee === 'number' && tx.fee > 0) ? applyConversion(tx.fee).toFixed(2).replace('.', ',') : '-';

                    let totalNeto = tx.total || 0;
                    if (tx.type === 'buy') {
                       totalNeto = -((tx.amount * tx.price) + (tx.fee || 0));
                    } else if (tx.type === 'sell') {
                       totalNeto = (tx.amount * tx.price) - (tx.fee || 0);
                    } else if (tx.type === 'mortgage_out' || tx.type === 'liquidez_out') {
                       totalNeto = -Math.abs(totalNeto);
                    }
                    const totalStr = applyConversion(totalNeto).toFixed(2).replace('.', ',');

                    return `${date};${assetName};"${typeName}";${qty};${price};${comisiones};${totalStr}`;
                  });

        const csvContent = [headers.join(';'), ...rows].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
                  
                  const today = new Date().toISOString().split('T')[0];
                  const fileName = `QuantumCap_Operaciones_${today}.csv`;
                  
                  const link = document.createElement('a');
                  link.setAttribute('href', url);
                  link.setAttribute('download', fileName);
                  link.style.visibility = 'hidden';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-emerald-500/50 hover:bg-emerald-500/10 text-emerald-400 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] shrink-0"
              >
                📥 Exportar Informe (CSV)
              </button>
            </div>
            
            {/* BARRA DE HERRAMIENTAS Y FILTROS */}
            <div className="flex flex-col xl:flex-row gap-4 xl:items-end p-5 bg-zinc-900/50 border border-slate-800 rounded-3xl">
               <div className="flex-1 space-y-3">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Rango Temporal</p>
                 <div className="flex flex-wrap gap-2">
                   <button onClick={() => setTxTimeFilter('1w')} className={pillClass(txTimeFilter === '1w')}>1 Semana</button>
                   <button onClick={() => setTxTimeFilter('1m')} className={pillClass(txTimeFilter === '1m')}>1 Mes</button>
                   <button onClick={() => setTxTimeFilter('3m')} className={pillClass(txTimeFilter === '3m')}>3 Meses</button>
                   <button onClick={() => setTxTimeFilter('6m')} className={pillClass(txTimeFilter === '6m')}>6 Meses</button>
                   <button onClick={() => setTxTimeFilter('1y')} className={pillClass(txTimeFilter === '1y')}>1 Año</button>
                   <button onClick={() => setTxTimeFilter('all')} className={pillClass(txTimeFilter === 'all')}>Todo</button>
                   <button onClick={() => setTxTimeFilter('custom')} className={pillClass(txTimeFilter === 'custom')}>Personalizado</button>
                 </div>
                 {txTimeFilter === 'custom' && (
                   <div className="flex flex-wrap items-center gap-3 animate-in fade-in slide-in-from-top-2">
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] uppercase font-bold text-slate-500">Desde</span>
                       <input type="date" value={txCustomStartDate} onChange={e => setTxCustomStartDate(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500" />
                     </div>
                     <span className="text-slate-600">-</span>
                     <div className="flex items-center gap-2">
                       <span className="text-[10px] uppercase font-bold text-slate-500">Hasta</span>
                       <input type="date" value={txCustomEndDate} onChange={e => setTxCustomEndDate(e.target.value)} className="bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500" />
                     </div>
                   </div>
                 )}
               </div>

               <div className="space-y-3 xl:w-64">
                 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tipo de Transacción</p>
                 <select 
                   value={txCategoryFilter} 
                   onChange={(e) => setTxCategoryFilter(e.target.value)}
                   className="w-full bg-slate-950 border border-slate-800 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 cursor-pointer"
                 >
                    <option value="all">Todas las operaciones</option>
                    <option value="buy">Compras</option>
                    <option value="sell">Ventas</option>
                    <option value="dividend">Dividendos</option>
                    <option value="income">Ingresos (Alq/Liq)</option>
                    <option value="expense">Gastos (Hipot/Ret)</option>
                 </select>
               </div>
            </div>

            {/* SUMARIO DINAMICO */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                <p className="text-sm font-medium text-slate-400 mb-2">Balance del periodo filtrado</p>
                <p className={`text-3xl font-bold ${sumarioBalanceNeto >= 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                   {sumarioBalanceNeto >= 0 ? '+' : ''}{formatCurrency(sumarioBalanceNeto)}
                </p>
            </div>
            
            <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Resultados ({filteredTransacciones.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse hidden md:table">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50">
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Fecha</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Activo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Tipo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Cantidad</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Precio Unit.</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredTransacciones.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-medium">
                          {new Date(tx.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-white">{tx.assetName || tx.ticker}</div>
                          <div className="text-xs text-slate-500 font-medium">{tx.ticker}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                            (tx.type === 'buy' || tx.type === 'liquidez_in' || tx.type === 'rent_in') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : (tx.type === 'sell' || tx.type === 'liquidez_out' || tx.type === 'mortgage_out') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venta' : tx.type === 'liquidez_in' ? 'Ingreso' : tx.type === 'liquidez_out' ? 'Retirada' : tx.type === 'rent_in' ? 'Alquiler' : tx.type === 'mortgage_out' ? 'Hipoteca' : 'Dividendo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-300 font-medium">
                          {tx.ticker === 'Efectivo' || tx.type === 'dividend' || tx.type === 'rent_in' || tx.type === 'mortgage_out' ? '-' : tx.amount}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-slate-300">
                          {tx.ticker === 'Efectivo' || tx.type === 'dividend' || tx.type === 'rent_in' || tx.type === 'mortgage_out' ? '-' : formatCurrency(tx.price, tx.type === 'buy' || tx.type === 'sell' || tx.type === 'dividend')}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-white flex flex-col items-end">
                          <span>{formatCurrency(tx.total, tx.type === 'buy' || tx.type === 'sell' || tx.type === 'dividend')}</span>
                          {tx.fee > 0 && (
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap pt-0.5">
                              (-{formatCurrency(tx.fee, tx.type === 'buy' || tx.type === 'sell' || tx.type === 'dividend')} fee)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredTransacciones.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                           <p className="text-slate-500 font-medium">No hay operaciones registradas aún.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="block md:hidden divide-y divide-slate-800">
                  {filteredTransacciones.map((tx: any) => {
                    const typeLabel = tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venta' : tx.type === 'liquidez_in' ? 'Ingreso' : tx.type === 'liquidez_out' ? 'Retirada' : tx.type === 'rent_in' ? 'Alquiler' : tx.type === 'mortgage_out' ? 'Hipoteca' : 'Dividendo';
                    const txColorClass = (tx.type === 'buy' || tx.type === 'liquidez_in' || tx.type === 'rent_in') ? 'text-emerald-400' 
                             : (tx.type === 'sell' || tx.type === 'liquidez_out' || tx.type === 'mortgage_out') ? 'text-rose-400'
                             : 'text-blue-400';
                             
                    return (
                      <div key={tx.id} className="p-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                             <span className="text-sm font-bold text-white">{(tx.assetName || tx.ticker || '?').substring(0,2).toUpperCase()}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold text-white truncate max-w-[120px]">{tx.assetName || tx.ticker}</span>
                             <span className="text-xs text-slate-500 font-medium">{typeLabel} • {new Date(tx.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                           </div>
                         </div>
                         <div className="flex flex-col items-end shrink-0">
                           <span className={`text-sm font-bold ${txColorClass}`}>{formatCurrency(tx.total, tx.type === 'buy' || tx.type === 'sell' || tx.type === 'dividend')}</span>
                           <span className="text-xs text-slate-500 font-medium">{tx.ticker === 'Efectivo' || tx.type === 'dividend' || tx.type === 'rent_in' || tx.type === 'mortgage_out' ? '-' : `${tx.amount} x ${formatCurrency(tx.price, tx.type === 'buy' || tx.type === 'sell' || tx.type === 'dividend')}`}</span>
                         </div>
                      </div>
                    )
                  })}
                  {filteredTransacciones.length === 0 && (
                      <div className="p-8 text-center text-sm text-slate-500 font-medium">No hay operaciones registradas aún.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }
      case 'analitica':
        const barData = [
          { name: 'Cripto', invertido: cryptoCostBasis, actual: cryptoTotal },
          { name: 'Acciones', invertido: stocksCostBasis, actual: stocksTotal },
          { name: 'Inmuebles', invertido: realEstateGross - realEstateNet, actual: realEstateNet }, // Simplified
          { name: 'Liquidez', invertido: liquidityTotal, actual: liquidityTotal },
        ];

        const realizedProfit = convertUsdToCurrent((data.transacciones || []).reduce((acc: number, tx: any) => acc + (tx.pnl || 0), 0));
        const unrealizedProfit = (cryptoTotal - cryptoCostBasis) + (stocksTotal - stocksCostBasis);
        const globalProfit = realizedProfit + unrealizedProfit;

        let targets = { Cripto: 10, Acciones: 40, Inmuebles: 40, Liquidez: 10 };
        try {
            const saved = localStorage.getItem('quantumCapTargets');
            if (saved) targets = JSON.parse(saved);
        } catch {}

        const currentTotalAssets = cryptoTotal + stocksTotal + realEstateGross + liquidityTotal;
        const rebalanceData = [
            { name: 'Cripto', val: cryptoTotal, tgt: targets.Cripto, color: 'text-orange-400', bar: 'bg-orange-500', bg: 'bg-orange-500', icon: <Bitcoin className="w-5 h-5 text-orange-400" /> },
            { name: 'Acciones', val: stocksTotal, tgt: targets.Acciones, color: 'text-blue-400', bar: 'bg-blue-500', bg: 'bg-blue-500', icon: <TrendingUp className="w-5 h-5 text-blue-400" /> },
            { name: 'Inmuebles', val: realEstateGross, tgt: targets.Inmuebles, color: 'text-purple-400', bar: 'bg-purple-500', bg: 'bg-purple-500', icon: <Home className="w-5 h-5 text-purple-400" /> },
            { name: 'Liquidez', val: liquidityTotal, tgt: targets.Liquidez, color: 'text-emerald-400', bar: 'bg-emerald-500', bg: 'bg-emerald-500', icon: <Wallet className="w-5 h-5 text-emerald-400" /> }
        ].map(item => {
            const actualPct = currentTotalAssets > 0 ? (item.val / currentTotalAssets) * 100 : 0;
            const targetVal = currentTotalAssets * (item.tgt / 100);
            const diffAmount = targetVal - item.val;
            return { ...item, actualPct, diffAmount };
        });

        // Proyector de Ingresos Pasivos
        const generatePassiveIncomeProjection = () => {
          const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const currentMonth = new Date().getMonth(); 
          
          const projection = [];
          
          for (let i = 0; i < 12; i++) {
            const monthIndex = (currentMonth + i + 1) % 12;
            const monthName = months[monthIndex];
            
            const rentsBase = data.inmuebles.reduce((acc: number, curr: any) => acc + (curr.rent || 0), 0);
            const rentsConverted = convertEurToCurrent(rentsBase);
            
            let dividendsBase = 0;
            data.acciones.forEach((stock: any, idx: number) => {
                const annualYieldPct = stock.dividend !== undefined ? stock.dividend : 2; // Default 2%
                const annualYieldUSD = stock.amount * (stock.price || 0) * (annualYieldPct / 100);
                const payoutOffset = idx % 3;
                if ((i + payoutOffset) % 3 === 0) {
                    dividendsBase += (annualYieldUSD / 4);
                }
            });
            const dividendsConverted = convertUsdToCurrent(dividendsBase);
            
            projection.push({
              name: monthName,
              Inmuebles: rentsConverted,
              Dividendos: dividendsConverted,
              total: rentsConverted + dividendsConverted
            });
          }
          return projection;
        };

        const passiveIncomeData = generatePassiveIncomeProjection();
        const totalYearlyPassive = passiveIncomeData.reduce((acc, curr) => acc + curr.total, 0);
        const avgMonthlyPassive = totalYearlyPassive / 12;
        const budgetBase = 3000;
        const passiveCoveragePct = ((avgMonthlyPassive / budgetBase) * 100).toFixed(1);

        return (
          <div className="p-4 md:p-6 lg:p-10 flex-1 flex flex-col space-y-6 md:space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Analytics Center</h2>
                <p className="text-sm text-slate-400">Análisis detallado de rendimiento y riesgo.</p>
              </div>
              <button 
                onClick={forceRefresh}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                <RefreshCw className={`w-4 h-4 ${(isFetchingPrices || isFetchingStocks) ? 'animate-spin' : ''}`} />
                <span>Actualizar Análisis</span>
              </button>
            </div>

            {/* KPI Principal Anclado (Número de Libertad) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 flex items-center justify-between shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none"></div>
              <div className="relative z-10 w-full">
                 <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-widest mb-2 md:mb-3">Ingreso Pasivo Mensual Promedio (Libertad)</p>
                 <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
                    <p className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                      {formatCurrency(avgMonthlyPassive)}
                    </p>
                    <div className="flex items-center gap-2 text-sm bg-slate-950/50 p-2 rounded-xl border border-slate-800/50 w-fit">
                       <span className="font-bold text-emerald-400 text-lg">{passiveCoveragePct}%</span>
                       <span className="text-slate-500 font-medium">Cobertura de vida ({formatCurrency(budgetBase)}/mes)</span>
                    </div>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-2">
              <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Beneficio No Realizado</p>
                <p className={`text-2xl font-bold ${unrealizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(unrealizedProfit)}
                </p>
              </div>
              <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Beneficio Realizado</p>
                <p className={`text-2xl font-bold ${realizedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(realizedProfit)}
                </p>
              </div>
              <div className={`border rounded-3xl p-6 relative overflow-hidden ${globalProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${globalProfit >= 0 ? 'text-emerald-500/70' : 'text-rose-500/70'}`}>Beneficio Global Total</p>
                <p className={`text-2xl font-bold ${globalProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(globalProfit)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart */}
              <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-[400px]">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 opacity-70">Distribución Patrimonial</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cripto', value: cryptoTotal },
                          { name: 'Acciones', value: stocksTotal },
                          { name: 'Inmuebles', value: realEstateGross },
                          { name: 'Liquidez', value: liquidityTotal },
                          { name: 'Deudas', value: totalLiabilities }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value"
                      >
                        {[
                          { name: 'Cripto', value: cryptoTotal },
                          { name: 'Acciones', value: stocksTotal },
                          { name: 'Inmuebles', value: realEstateGross },
                          { name: 'Liquidez', value: liquidityTotal },
                          { name: 'Deudas', value: totalLiabilities }
                        ].filter(d => d.value > 0).map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.name === 'Deudas' ? '#ef4444' : COLORS[index % COLORS.length]} stroke="none" />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="lg:col-span-2 bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 flex flex-col h-[400px]">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 opacity-70">Rendimiento vs Coste</h3>
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }} />
                      <Bar dataKey="invertido" name="Capital Invertido" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                      <Bar dataKey="actual" name="Valor Actual" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Rebalanceo de Cartera */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
              <div className="p-6 md:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Rebalanceo de Cartera</h3>
                  <p className="text-sm text-slate-400 font-medium">Desviaciones respecto al objetivo de asignación predefinido.</p>
                </div>
              </div>

              {/* Vista Móvil (Action Cards) */}
              <div className="block md:hidden p-4 space-y-4 bg-slate-950">
                {rebalanceData.map((item, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${item.bg}/10 flex items-center justify-center shrink-0`}>
                          {item.icon}
                        </div>
                        <span className="font-bold text-white">{item.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-800 px-2 py-1 rounded-lg">Target: {item.tgt}%</span>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-slate-400 font-medium font-mono text-[10px] uppercase tracking-wider">Actual</span>
                        <span className={`font-bold ${item.color}`}>{item.actualPct.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full relative overflow-hidden">
                        <div className={`absolute top-0 left-0 h-full ${item.bar} rounded-full transition-all duration-1000`} style={{ width: `${Math.min(item.actualPct, 100)}%` }}></div>
                        <div className="absolute top-0 w-1 h-full bg-white z-10" style={{ left: `${item.tgt}%` }}></div>
                      </div>
                    </div>

                    <div className={`mt-1 p-3 rounded-xl text-center text-sm font-bold shadow-sm ${item.diffAmount > 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                      {item.diffAmount > 0 ? `🟢 Aportar: +${formatCurrency(item.diffAmount)}` : `🔴 Reducir: ${formatCurrency(item.diffAmount)}`}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vista Desktop (Tabla) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900">
                      <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">Activo / Categoría</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Target %</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Actual %</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Desviación</th>
                      <th className="px-8 py-5 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">Acción Sugerida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 bg-slate-950">
                    {rebalanceData.map((item, i) => (
                      <tr key={i} className="hover:bg-slate-900 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${item.bg}/10 flex items-center justify-center shrink-0`}>
                              {item.icon}
                            </div>
                            <span className="font-bold text-white tracking-wide">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right font-mono text-slate-400">{item.tgt}%</td>
                        <td className="px-8 py-5 text-right font-mono text-white font-bold">{item.actualPct.toFixed(1)}%</td>
                        <td className="px-8 py-5 text-right">
                          <span className={`inline-flex items-center gap-1 font-mono font-bold ${item.diffAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.diffAmount > 0 ? '+' : ''}{(item.actualPct - item.tgt).toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-bold">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border ${item.diffAmount > 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                             {item.diffAmount > 0 ? `+ ${formatCurrency(item.diffAmount)}` : formatCurrency(item.diffAmount)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Proyección de Flujo de Caja (Próximos 12 meses) */}
            <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="p-6 md:p-8 border-b border-slate-800 relative z-10">
                <h3 className="text-lg font-bold text-white mb-1">Proyección de Flujo de Caja (12 Meses)</h3>
                <p className="text-sm text-slate-400">Ingresos pasivos estimados para los próximos meses.</p>
              </div>
              
              <div className="relative z-10 overflow-x-auto snap-x scrollbar-none md:overflow-x-visible md:snap-none w-full">
                <div className="p-4 md:p-8 h-[350px] min-w-[600px] md:min-w-0 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={passiveIncomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => new Intl.NumberFormat(baseCurrency === 'EUR' ? 'es-ES' : 'en-US', { style: 'currency', currency: baseCurrency, maximumFractionDigits: 0 }).format(v)} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="top" align="right" iconType="circle" />
                      <Bar dataKey="Inmuebles" stackId="a" fill="#a855f7" radius={[0, 0, 0, 0]} barSize={40} />
                      <Bar dataKey="Dividendos" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Portfolio vs Invested Evolution */}
            <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-8">
              <h3 className="text-lg font-bold text-white mb-6">Evolución del Patrimonio</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData.length > 0 ? historicalData.map((d, i) => ({
                    ...d,
                    invested: (stocksCostBasis + cryptoCostBasis + liquidityTotal) * (0.8 + (i / historicalData.length) * 0.2), // Mocking steady growth of contributions
                    value: d.price * (totalNetWorth / (historicalData[historicalData.length-1]?.price || 1)) // Mocking portfolio correlation with top asset
                  })) : []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }} />
                    <Legend verticalAlign="top" align="right" />
                    <Line type="stepAfter" dataKey="invested" name="Capital Invertido" stroke="#334155" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="value" name="Valor de Cartera" stroke="#3b82f6" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market History */}
            <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Evolución de Mercado: {topAssets[0]?.name || 'Activo Top'}</h3>
                  <p className="text-sm text-slate-400 font-medium">Comparativa de fluctuación del activo principal.</p>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {['1D', '7D', '30D', '90D', '1Y', 'TOTAL'].map(range => (
                    <button 
                      key={range}
                      onClick={() => setSelectedRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedRange === range ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
              <div className="h-[350px] w-full relative">
                {isFetchingHistory && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/20 backdrop-blur-sm rounded-xl">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} mirror tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={3} dot={false} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Ingresos Pasivos Acumulados */}
            <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-8">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-white mb-1">Ingresos Pasivos Acumulados</h3>
                <p className="text-sm text-slate-400 font-medium">Acumulación de dividendos y otros ingresos por activos a lo largo del tiempo.</p>
              </div>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={
                    (() => {
                      const divs = (data.transacciones || []).filter((tx: any) => tx.type === 'dividend').sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      let accum = 0;
                      return divs.map((tx: any) => {
                        accum += tx.total;
                        return { date: new Date(tx.date).toLocaleDateString(), value: accum };
                      });
                    })()
                  }>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} mirror tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #18181b', borderRadius: '12px' }} />
                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={true} animationDuration={1500} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        );
      case 'cripto':
        return (
          <div className="p-6 lg:p-10 flex-1 flex flex-col relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Criptoactivos</h2>
                <p className="text-sm text-slate-400">Desglose de tu portfolio descentralizado.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={forceRefresh} 
                  disabled={isFetchingPrices}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-slate-700 disabled:opacity-50 relative z-10"
                >
                  <RefreshCw className={`w-4 h-4 ${(isFetchingPrices || isFetchingStocks) ? 'animate-spin' : ''}`} />
                  <span>Refrescar Precios</span>
                </button>
                <button onClick={() => handleOpenModal('cripto')} className="bg-orange-500 hover:bg-orange-400 text-amber-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-orange-500/20 shrink-0 relative z-10">
                  Añadir Activo
                </button>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
              <table key={lastUpdated} className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-left text-[11px] text-slate-500 uppercase tracking-tighter border-b border-slate-800 bg-slate-950/50">
                    <th className="px-6 py-4 font-semibold">Activo</th>
                    <th className="px-6 py-4 font-semibold text-right">Cantidad</th>
                    <th className="px-6 py-4 font-semibold text-right">Precio Actual</th>
                    <th className="px-6 py-4 font-semibold text-right">Valor Total</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.cripto.map((crypto: any) => {
                    const purchasePrice = crypto.purchasePrice || crypto.price || 0;
                    const roi = purchasePrice > 0 ? ((crypto.price - purchasePrice) / purchasePrice) * 100 : 0;
                    const isExpanded = expandedAssetId === crypto.id;
                    const filteredTx = (data.transacciones || []).filter((tx: any) => tx.assetId === crypto.id).slice(0, 5);

                    return (
                    <React.Fragment key={crypto.id}>
                    <tr 
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      onClick={() => setExpandedAssetId(isExpanded ? null : crypto.id)}
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs border border-orange-500/20">
                          {crypto.symbol.substring(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className="text-sm font-semibold text-white">{crypto.name}</p>
                             <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                               <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Live 24/7</span>
                             </div>
                          </div>
                          <p className="text-xs text-slate-500">{crypto.symbol.toUpperCase()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-300 font-medium">{crypto.amount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <div className="text-sm">
                             <PriceCell price={convertUsdToCurrent(crypto.price)} currency={baseCurrency} />
                          </div>
                          {crypto.updatedAt && (
                            <span className="text-[10px] text-slate-500 font-medium">Actualizado: {crypto.updatedAt}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-white">{formatCurrency(crypto.amount * crypto.price, true)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleOpenBuyMore('cripto', crypto)} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Comprar más">
                            <Plus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenSell('cripto', crypto)} className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Vender">
                            <Minus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('cripto', crypto.id)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-900/30">
                        <td colSpan={5} className="p-6 border-t border-slate-800">
                          <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* General Stats */}
                            <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                               <div className="flex-1">
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1" title="Precio Medio Ponderado incluyendo comisiones">Break-Even (PMP)</p>
                                 <p className="text-xl font-bold text-white">{formatCurrency(purchasePrice, true)}</p>
                               </div>
                               <div className="flex-1">
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">ROI Neto</p>
                                 <p className={`text-xl font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                   {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                 </p>
                               </div>
                               <div className="flex-1 flex sm:justify-end">
                                 <button onClick={() => handleOpenDividend('cripto', crypto)} className="text-xs font-bold px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                                   Registrar Ingreso
                                 </button>
                               </div>
                            </div>
                            
                            {/* Mini Tx History */}
                            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 max-h-48 overflow-y-auto">
                               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Últimas Operaciones</p>
                               {filteredTx.length > 0 ? (
                                 <div className="space-y-3">
                                   {filteredTx.map((tx: any) => (
                                     <div key={tx.id} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                       <div className="flex flex-col">
                                          <span className="text-slate-300 font-medium">
                                            {tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venta' : 'Ingreso/Div'}
                                          </span>
                                          <span className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
                                       </div>
                                       <div className="text-right flex flex-col items-end">
                                          <span className={tx.type === 'buy' ? 'text-emerald-400' : tx.type === 'sell' ? 'text-rose-400' : 'text-blue-400 font-bold'}>
                                            {tx.type === 'dividend' ? `+${formatCurrency(tx.total, true)}` : `${tx.amount} a ${formatCurrency(tx.price, true)}`}
                                          </span>
                                          {tx.fee > 0 && <span className="text-[10px] text-slate-500 font-medium pt-0.5">-{formatCurrency(tx.fee, true)} fee</span>}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-xs text-slate-500">No hay operaciones registradas para este activo.</p>
                               )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )})}
                  {data.cripto.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
                            <Bitcoin className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-white font-medium">No hay criptoactivos</p>
                            <p className="text-slate-500 text-xs">Pulsa 'Añadir Activo' para registrar tu primera moneda.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'acciones':
        return (
          <div className="p-6 lg:p-10 flex-1 flex flex-col relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Acciones / ETFs</h2>
                <p className="text-sm text-slate-400">Rendimiento e ingresos por dividendos.</p>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={forceRefresh} 
                  disabled={isFetchingStocks}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors border border-slate-700 disabled:opacity-50 relative z-10"
                >
                  <RefreshCw className={`w-4 h-4 ${(isFetchingPrices || isFetchingStocks) ? 'animate-spin' : ''}`} />
                  <span>Refrescar Precios</span>
                </button>
                <button onClick={() => handleOpenModal('acciones')} className="bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-blue-500/20 shrink-0 relative z-10">
                  Añadir Posición
                </button>
              </div>
            </div>
            {apiWarning && (
              <div className="mb-6 px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
                ⚠️ {apiWarning}
              </div>
            )}
            <div className={!apiWarning ? "mt-6" : ""}></div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto">
              <table key={lastUpdated} className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="text-left text-[11px] text-slate-500 uppercase tracking-tighter border-b border-slate-800 bg-slate-950/50">
                    <th className="px-6 py-4 font-semibold">Ticker / Empresa</th>
                    <th className="px-6 py-4 font-semibold text-right">Cantidad</th>
                    <th className="px-6 py-4 font-semibold text-right">Precio Actual</th>
                    <th className="px-6 py-4 font-semibold text-right">Valor Total</th>
                    <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {data.acciones.map((stock: any) => {
                    const purchasePrice = stock.purchasePrice || stock.price || 0;
                    const roi = purchasePrice > 0 ? ((stock.price - purchasePrice) / purchasePrice) * 100 : 0;
                    const isExpanded = expandedAssetId === stock.id;
                    const filteredTx = (data.transacciones || []).filter((tx: any) => tx.assetId === stock.id).slice(0, 5);

                    return (
                    <React.Fragment key={stock.id}>
                    <tr 
                      className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                      onClick={() => setExpandedAssetId(isExpanded ? null : stock.id)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                            {stock.ticker.toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-white">{stock.name}</span>
                              {isMarketOpenForStock(stock) ? (
                                <div className="flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter">Mercado Abierto</span>
                                </div>
                              ) : (
                                <div className="flex flex-col items-start">
                                  <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Mercado Cerrado</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm text-slate-300 font-medium">{stock.amount}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-2">
                             {!isMarketOpenForStock(stock) ? (
                                <span className="flex flex-col items-end gap-0.5 text-amber-500 text-[10px] mb-1 font-bold leading-none">
                                   <span className="flex items-center gap-1"><Info className="w-3 h-3"/> Cierre de mercado</span>
                                   <span className="text-[9px] opacity-80">{getNextOpeningMessageForStock(stock)}</span>
                                </span>
                             ) : null}
                             {stock.apiWarning && (
                                <AlertTriangle className="w-4 h-4 text-amber-500" title={stock.apiWarning} />
                             )}
                             {!stock.apiWarning && stock.fetchFailed && (
                                <AlertTriangle className="w-4 h-4 text-rose-500" title="Error al actualizar precio" />
                             )}
                             {stock.isLoadingPrice ? (
                                <span className="text-slate-300 text-sm font-medium animate-pulse">Cargando...</span>
                             ) : (
                                <PriceCell price={convertUsdToCurrent(stock.price)} currency={baseCurrency} />
                             )}
                          </div>
                          {stock.updatedAt && (
                            <span className="text-[10px] text-slate-500 font-medium tracking-tight">Actualizado (ESP): {stock.updatedAt}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-white">{formatCurrency(stock.amount * stock.price, true)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => handleOpenBuyMore('acciones', stock)} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Comprar más">
                            <Plus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleOpenSell('acciones', stock)} className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors" title="Vender">
                            <Minus className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete('acciones', stock.id)} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-slate-900/30">
                        <td colSpan={5} className="p-6 border-t border-slate-800">
                          <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                            {/* General Stats */}
                            <div className="flex-1 flex flex-col sm:flex-row gap-4 sm:items-center bg-slate-950 p-4 rounded-2xl border border-slate-800">
                               <div className="flex-1">
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1" title="Precio Medio Ponderado incluyendo comisiones">Break-Even (PMP)</p>
                                 <p className="text-xl font-bold text-white">{formatCurrency(purchasePrice, true)}</p>
                               </div>
                               <div className="flex-1">
                                 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-1">ROI Neto</p>
                                 <p className={`text-xl font-bold ${roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                   {roi >= 0 ? '+' : ''}{roi.toFixed(2)}%
                                 </p>
                               </div>
                               <div className="flex-1 flex sm:justify-end">
                                 <button onClick={() => handleOpenDividend('acciones', stock)} className="text-xs font-bold px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/20">
                                   Registrar Dividendo
                                 </button>
                               </div>
                            </div>
                            
                            {/* Mini Tx History */}
                            <div className="flex-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 max-h-48 overflow-y-auto">
                               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Últimas Operaciones</p>
                               {filteredTx.length > 0 ? (
                                 <div className="space-y-3">
                                   {filteredTx.map((tx: any) => (
                                     <div key={tx.id} className="flex justify-between items-center text-sm border-b border-slate-800/50 pb-2 last:border-0 last:pb-0">
                                       <div className="flex flex-col">
                                          <span className="text-slate-300 font-medium">
                                            {tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venta' : 'Dividendo'}
                                          </span>
                                          <span className="text-[10px] text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
                                       </div>
                                       <div className="text-right flex flex-col items-end">
                                          <span className={tx.type === 'buy' ? 'text-emerald-400' : tx.type === 'sell' ? 'text-rose-400' : 'text-blue-400 font-bold'}>
                                            {tx.type === 'dividend' ? `+${formatCurrency(tx.total, true)}` : `${tx.amount} a ${formatCurrency(tx.price, true)}`}
                                          </span>
                                          {tx.fee > 0 && <span className="text-[10px] text-slate-500 font-medium pt-0.5">-{formatCurrency(tx.fee, true)} fee</span>}
                                       </div>
                                     </div>
                                   ))}
                                 </div>
                               ) : (
                                 <p className="text-xs text-slate-500">No hay operaciones registradas para este activo.</p>
                               )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  )})}
                  {data.acciones.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600">
                            <TrendingUp className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-white font-medium">No hay acciones registradas</p>
                            <p className="text-slate-500 text-xs">Pulsa 'Añadir Posición' para empezar a trackear tus inversiones.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-xs font-medium text-slate-400">Estado de la API:</span>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isFetchingStocks ? 'bg-amber-400 animate-pulse' : apiWarning ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                <span className="text-xs font-bold text-white">
                  {isFetchingStocks ? 'Cargando...' : apiWarning ? apiWarning : 'Conectado (Yahoo Finance)'}
                </span>
              </div>
            </div>
          </div>
        );

      case 'inmuebles':
        const totalRent = data.inmuebles.reduce((acc: number, curr: any) => acc + (curr.rent || 0), 0);
        const totalMortgageQuota = data.inmuebles.reduce((acc: number, curr: any) => acc + (curr.quota || 0), 0);
        const estimatedCashFlow = totalRent - totalMortgageQuota;

        return (
          <div className="p-6 lg:p-10 flex-1 flex flex-col relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Inmuebles</h2>
                <p className="text-sm text-slate-400">Gestión de tus propiedades en bienes raíces.</p>
              </div>
              <button onClick={() => handleOpenModal('inmuebles')} className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-purple-500/20 shrink-0 relative z-10">
                Añadir Propiedad
              </button>
            </div>
            
            <div className="grid grid-cols-1 mb-8">
               <div className="bg-zinc-900/50 border border-slate-800 rounded-3xl p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <History className="w-24 h-24" />
                  </div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Cash Flow Mensual Estimado</h3>
                  <p className={`text-3xl font-bold ${estimatedCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {estimatedCashFlow >= 0 ? '+' : ''}{formatCurrency(estimatedCashFlow, false)}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Ingresos (Rentas): <span className="text-emerald-400">{formatCurrency(totalRent, false)}</span> | Gastos (Hipoteca): <span className="text-rose-400">{formatCurrency(totalMortgageQuota, false)}</span>
                  </p>
               </div>
            </div>

            {data.inmuebles.length === 0 ? (
               <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm mt-4">
                 No hay inmuebles. Añade uno para empezar.
               </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {data.inmuebles.map((re: any) => (
                  <div key={re.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row gap-6 relative group">
                    <button 
                      onClick={() => handleDelete('inmuebles', re.id)}
                      className="absolute top-4 right-4 p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4"/>
                    </button>
                    <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl shrink-0 text-purple-400 self-start">
                      <Home className="w-8 h-8" />
                    </div>
                    <div className="flex-1 space-y-4 pt-1">
                      <div className="pr-10">
                        <h3 className="text-lg font-bold text-white tracking-tight">{re.address}</h3>
                        <p className="text-xs text-slate-500 font-medium mt-1">Propiedad Inmobiliaria</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Valor Mercado</p>
                          <p className="text-sm font-bold text-white">{formatCurrency(re.marketValue, false)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Hipoteca Pend.</p>
                          <p className="text-sm font-medium text-rose-400">{formatCurrency(re.mortgage, false)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Renta Est.</p>
                          <p className="text-sm font-bold text-emerald-400">{re.rent ? formatCurrency(re.rent, false) : 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/50">
                        {re.rent > 0 && (
                          <button onClick={() => handleOpenRent(re)} className="text-xs font-bold px-4 py-2 bg-emerald-500 text-slate-950 rounded-lg hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/20">
                            Cobrar Alquiler
                          </button>
                        )}
                        {re.mortgage > 0 && (
                          <button onClick={() => handleOpenMortgagePayment(re)} className="text-xs font-bold px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20">
                            Pagar Hipoteca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'liquidez':
        return (
          <div className="p-6 lg:p-10 flex-1 flex flex-col relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Liquidez</h2>
                <p className="text-sm text-slate-400">Distribución de efectivo y metas de ahorro.</p>
              </div>
              <button onClick={() => handleOpenModal('liquidez')} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/20 shrink-0 relative z-10">
                Añadir Cuenta
              </button>
            </div>
            
            {data.liquidez.length === 0 ? (
               <div className="text-center py-10 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm mt-4">
                 No hay cuentas. Añade una para empezar.
               </div>
            ) : (
              <div className="space-y-4">
                {data.liquidez.map((liq: any) => {
                  const isNegative = liq.balance < 0;
                  const progressVal = liq.goal ? (isNegative ? 0 : Math.min((liq.balance / liq.goal) * 100, 100)) : 100;
                  return (
                    <div key={liq.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      
                      {/* Izquierda: Icono y datos base */}
                      <div className="flex items-center gap-4 w-full md:w-1/4 shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                           <Wallet className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{liq.entity}</h3>
                          <p className="text-xs text-slate-400">{liq.type}</p>
                        </div>
                      </div>
                      
                      {/* Centro: Barra de progreso */}
                      <div className="flex-1 w-full flex flex-col justify-center">
                        {liq.goal ? (
                          <>
                            <div className="flex justify-between items-end mb-2">
                              <p className="text-xs text-slate-400 font-medium">Meta: {formatCurrency(liq.goal, false)}</p>
                              <p className={`text-[10px] font-mono ${isNegative ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {isNegative ? '0.0%' : `${progressVal.toFixed(1)}%`}
                              </p>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                               <div 
                                 className={`${isNegative ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'} h-full rounded-full transition-all duration-500`} 
                                 style={{ width: isNegative ? '100%' : `${progressVal}%` }}
                               ></div>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-2"></div>
                        )}
                      </div>

                      {/* Derecha: Números y botones */}
                      <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto shrink-0">
                        <div className="flex flex-col items-end shrink-0 min-w-[120px]">
                          <p className={`text-xl font-bold tracking-tight ${isNegative ? 'text-rose-400' : 'text-white'}`}>
                            {formatCurrency(liq.balance, false)}
                          </p>
                          {isNegative && (
                            <p className="text-xs text-rose-400/80 font-medium mt-1">Fondos Insuficientes</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0 border-l border-slate-800 pl-4">
                         <button onClick={() => handleOpenLiquidezTx(liq, 'add')} className="p-2 text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-transparent hover:border-emerald-500/20" title="Ingresar Efectivo">
                           <Plus className="w-4 h-4"/>
                         </button>
                         <button onClick={() => handleOpenLiquidezTx(liq, 'withdraw')} className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20" title="Retirar Efectivo">
                           <Minus className="w-4 h-4"/>
                         </button>
                         <div className="w-px h-6 bg-slate-800 mx-1"></div>
                         <button 
                           onClick={() => handleDelete('liquidez', liq.id)}
                           className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                           title="Eliminar Cuenta"
                         >
                           <Trash2 className="w-4 h-4"/>
                         </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'resumen':
      default:
        // QuantumAdvisor Logic
        const qaInsights = [];
        
        // Escenario Real Estate / Liquidez
        const realEstateRatio = realEstateGross / (totalNetWorth > 0 ? totalNetWorth : 1);
        const liquidityGoals = convertEurToCurrent(data.liquidez.reduce((acc: number, curr: any) => acc + (curr.goal || 0), 0));
        
        if (realEstateRatio > 0.5) {
          if (liquidityTotal < liquidityGoals) {
             const minLiquidityAccount = data.liquidez.reduce((prev: any, curr: any) => (prev.balance < curr.balance) ? prev : curr, { balance: Infinity, entity: 'tu cuenta' });
             
             qaInsights.push({
                type: 'warning',
                title: 'Módulo Inmobiliario y Liquidez',
                text: `Estructura patrimonial típica por volumen inmobiliario. Sin embargo, tu liquidez está comprometida. Prioriza acumular caja en ${minLiquidityAccount.entity} antes de amortizar deuda o buscar nuevas compras.`
             });
          } else {
             qaInsights.push({
                type: 'info',
                title: 'Módulo Inmobiliario y Liquidez',
                text: `Alta concentración en Real Estate (${(realEstateRatio * 100).toFixed(1)}%), respaldada por una posición de liquidez robusta. Tu patrimonio es sólido pero poco líquido; vigila el coste de oportunidad frente a la renta variable.`
             });
          }
        }
        
        // Módulo de Rendimiento y Rotación (Top Performer)
        const topPerformers = [...data.cripto, ...data.acciones].map((a: any) => ({
          name: a.name || a.ticker,
          category: a.category || (data.cripto.includes(a) ? 'Cripto' : 'Acciones'),
          roi: ((a.price - (a.purchasePrice || a.price)) / (a.purchasePrice || a.price)) * 100
        })).sort((a: any, b: any) => b.roi - a.roi);
        
        if (topPerformers.length > 0 && topPerformers[0].roi > 25) {
            let targetsPattern = { Cripto: 10, Acciones: 40, Inmuebles: 40, Liquidez: 10 };
            try {
                const saved = localStorage.getItem('quantumCapTargets');
                if (saved) targetsPattern = JSON.parse(saved);
            } catch {}

            const totalAssetsCategories = [
                { name: 'Cripto', val: cryptoTotal, targetPct: targetsPattern.Cripto || 0 },
                { name: 'Acciones', val: stocksTotal, targetPct: targetsPattern.Acciones || 0 },
                { name: 'Inmuebles', val: realEstateGross, targetPct: targetsPattern.Inmuebles || 0 },
                { name: 'Liquidez', val: liquidityTotal, targetPct: targetsPattern.Liquidez || 0 }
            ];
            
            const otherCategories = totalAssetsCategories.filter(c => c.name !== topPerformers[0].category);
            const underAllocated = otherCategories.map(c => {
               const targetVal = totalNetWorth * (c.targetPct / 100);
               const diff = targetVal - c.val;
               return { ...c, diff };
            }).sort((a, b) => b.diff - a.diff);
            
            const infraexpuesta = underAllocated.length > 0 ? underAllocated[0].name : 'Liquidez';
        
            qaInsights.push({
                type: 'success',
                title: 'Módulo de Rendimiento y Rotación',
                text: `Tu posición en ${topPerformers[0].name} acumula un +${topPerformers[0].roi.toFixed(1)}% neto. Evalúa si el peso actual desequilibra tu perfil de riesgo y considera ejecutar rebalanceos parciales hacia ${infraexpuesta}.`
            });
        }
        
        // Módulo de Apalancamiento (Pasivos / Deudas)
        const debtRatio = totalLiabilities / (totalNetWorth > 0 ? totalNetWorth : 1);
        if (debtRatio > 0.4) {
           qaInsights.push({
               type: 'warning',
               title: 'Módulo de Apalancamiento',
               text: `Tu nivel de apalancamiento es del ${(debtRatio * 100).toFixed(1)}%. Con los tipos actuales, asegúrate de que el Cash Flow neto de tus alquileres cubre holgadamente las cuotas antes de incrementar tu deuda.`
           });
        }

        return (
          <div className="flex flex-col">
            <header className="p-4 md:p-6 lg:p-10 pb-4 md:pb-6 border-b border-slate-800 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 md:gap-6">
                <div>
                  <p className="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-widest mb-1 md:mb-2">Patrimonio Neto (Calculado)</p>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white tracking-tight">{formatCurrency(totalNetWorth)}</h1>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-end gap-3 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <span className="hidden md:inline text-xs font-bold text-slate-500 uppercase">Divisa Global:</span>
                    <select
                      value={baseCurrency}
                      onChange={(e) => setBaseCurrency(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-white text-xs md:text-sm rounded-lg px-2 py-1 md:px-3 md:py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 md:px-3 md:py-1.5 rounded-full border border-emerald-500/20 max-w-fit text-[10px] md:text-xs text-center">
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden md:inline">Actualizado en tiempo real</span>
                    <span className="inline md:hidden uppercase tracking-wider">En tiempo real</span>
                  </div>
                </div>
              </div>
            </header>

            <div className="flex flex-col">

            <section className="order-1 md:hidden block px-4 pt-4 pb-0">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col p-4">
                <h3 className="font-bold text-white uppercase text-[10px] tracking-wider mb-2">Distribución de Cartera</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cripto', value: cryptoTotal },
                          { name: 'Acciones', value: stocksTotal },
                          { name: 'Inmuebles', value: realEstateGross },
                          { name: 'Liquidez', value: liquidityTotal },
                          { name: 'Deudas', value: totalLiabilities }
                        ].filter(d => d.value > 0)}
                        cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={5} dataKey="value"
                      >
                        {[
                          { name: 'Cripto', value: cryptoTotal },
                          { name: 'Acciones', value: stocksTotal },
                          { name: 'Inmuebles', value: realEstateGross },
                          { name: 'Liquidez', value: liquidityTotal },
                          { name: 'Deudas', value: totalLiabilities }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Deudas' ? '#ef4444' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>

            <section className="order-2 md:order-1 px-4 md:px-6 lg:px-10 py-4 md:py-6 grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {ASSET_CARDS.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <div 
                      key={index} 
                      onClick={() => setQuickBreakdownTab(card.tab)}
                      className={`p-3 md:p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex flex-col cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-sm ${card.colorHover}`}
                    >
                      <div className="flex justify-between items-start mb-2 md:mb-4">
                        <div className={`p-1.5 md:p-2 rounded-lg ${
                          index === 0 ? 'bg-orange-500/10 text-orange-500' :
                          index === 1 ? 'bg-blue-500/10 text-blue-500' :
                          index === 2 ? 'bg-purple-500/10 text-purple-500' :
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                      </div>
                      <p className="text-[10px] md:text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider truncate">{card.title}</p>
                      <p className="text-lg md:text-2xl font-bold text-white truncate drop-shadow-sm">{card.value}</p>
                    </div>
                  );
                })}
            </section>
            
            {qaInsights.length > 0 && (
              <section className="order-3 md:order-2 px-4 md:px-6 lg:px-10 pb-4 md:pb-6">
                <div className="bg-zinc-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 bg-slate-900/50 flex gap-2 items-center">
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
                    <h3 className="font-bold text-white uppercase text-[10px] md:text-xs tracking-widest">QuantumAdvisor (IA)</h3>
                  </div>
                  <div className="p-4 md:p-6 flex md:grid overflow-x-auto md:overflow-x-visible snap-x snap-mandatory md:snap-none md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 pb-2 md:pb-6 scrollbar-none">
                    {qaInsights.map((insight, i) => (
                      <div key={i} className={`p-4 md:p-5 rounded-2xl border flex gap-3 md:gap-4 min-w-[85%] md:min-w-0 snap-center md:snap-align-none ${
                          insight.type === 'warning' ? 'bg-orange-500/5 border-orange-500/20 text-orange-400' :
                          insight.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                          'bg-blue-500/5 border-blue-500/20 text-blue-400'
                      }`}>
                          <div className="mt-0.5 shrink-0">
                              {insight.type === 'warning' ? <AlertTriangle className="w-4 h-4 md:w-5 md:h-5"/> : 
                               insight.type === 'success' ? <Zap className="w-4 h-4 md:w-5 md:h-5"/> : <Info className="w-4 h-4 md:w-5 md:h-5"/>}
                          </div>
                          <div>
                              <p className="font-bold text-[10px] md:text-[11px] mb-1 md:mb-1.5 uppercase tracking-widest opacity-80">{insight.title}</p>
                              <p className="text-xs md:text-sm opacity-90 leading-relaxed font-medium">{insight.text}</p>
                          </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="order-4 md:order-3 px-4 md:px-6 lg:px-10 py-4 md:py-6 lg:py-8 grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
              <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h3 className="font-bold text-white uppercase text-xs tracking-wider">Top 5 de Activos</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="text-left text-[11px] text-slate-500 uppercase tracking-tighter border-b border-slate-800/50">
                        <th className="px-6 py-3 font-semibold">Activo</th>
                        <th className="px-6 py-3 font-semibold">Categoría</th>
                        <th className="px-6 py-3 font-semibold text-right">Valor Actual</th>
                        <th className="px-6 py-3 font-semibold text-right">Peso %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {topAssets.length > 0 ? topAssets.map((asset) => {
                        const initials = asset.name.substring(0, 2).toUpperCase();
                        
                        const badgeProps = asset.category === 'Cripto' ? { label: 'Cripto', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20', barColor: 'bg-orange-500', textColor: 'text-orange-400' }
                          : asset.category === 'Acción/ETF' ? { label: 'Acciones', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', barColor: 'bg-blue-500', textColor: 'text-blue-400' }
                          : asset.category === 'Inmueble' ? { label: 'Inmuebles', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20', barColor: 'bg-purple-500', textColor: 'text-purple-400' }
                          : { label: 'Liquidez', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', barColor: 'bg-emerald-500', textColor: 'text-emerald-400' };
                          
                        const hoverClass = asset.category === 'Cripto' ? 'hover:bg-orange-500/10'
                          : asset.category === 'Acción/ETF' ? 'hover:bg-blue-500/10'
                          : asset.category === 'Inmueble' ? 'hover:bg-purple-500/10'
                          : 'hover:bg-emerald-500/10';

                        return (
                          <tr 
                            key={asset.id} 
                            className={`${hoverClass} transition-colors group cursor-pointer`}
                            onClick={() => {
                              setIsModalOpen(false);
                              if (setQuickBreakdownTab) setQuickBreakdownTab(null);
                              
                              if (asset.category === 'Cripto') setActiveSection('cripto');
                              else if (asset.category === 'Acción/ETF') setActiveSection('acciones');
                              else if (asset.category === 'Inmueble') setActiveSection('inmuebles');
                              else if (asset.category === 'Liquidez') setActiveSection('liquidez');
                              
                              setExpandedAssetId(asset.id);
                            }}
                          >
                            <td className="px-6 py-4 flex items-center gap-3">
                              <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-white group-hover:border-slate-500/30 transition-colors">
                                {initials}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeProps.className}`}>
                                  {badgeProps.label}
                                </span>
                                <span className="text-sm font-medium text-white truncate max-w-[150px] sm:max-w-xs">{asset.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-xs text-slate-500 font-medium uppercase tracking-tight">{asset.category}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-sm font-bold text-white">{formatCurrency(asset.value)}</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <div className="hidden sm:inline-block w-16 lg:w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden align-middle">
                                   <div className={`${badgeProps.barColor} h-full transition-all duration-500`} style={{ width: asset.weight }}></div>
                                </div>
                                <span className={`text-[10px] font-mono ${badgeProps.textColor} font-bold`}>{asset.weight}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr><td colSpan={4} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-2">
                             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                               <TrendingUp className="w-6 h-6" />
                             </div>
                             <p className="text-slate-500 text-sm font-medium">Aún no tienes activos registrados.</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="hidden md:flex bg-slate-900 border border-slate-800 rounded-2xl flex-col p-6">
                <h3 className="font-bold text-white uppercase text-xs tracking-wider mb-6">Distribución de Cartera</h3>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Cripto', value: cryptoTotal },
                          { name: 'Acciones', value: stocksTotal },
                          { name: 'Inmuebles', value: realEstateGross },
                          { name: 'Liquidez', value: liquidityTotal },
                          { name: 'Deudas', value: totalLiabilities }
                        ].filter(d => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'Cripto', value: cryptoTotal },
                          { name: 'Acciones', value: stocksTotal },
                          { name: 'Inmuebles', value: realEstateGross },
                          { name: 'Liquidez', value: liquidityTotal },
                          { name: 'Deudas', value: totalLiabilities }
                        ].filter(d => d.value > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === 'Deudas' ? '#ef4444' : COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        align="center"
                        iconType="circle"
                        wrapperStyle={{ paddingTop: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col lg:flex-row overflow-hidden selection:bg-emerald-500/30 selection:text-white select-none relative">
      
      {/* Modal Principal (Overlays) */}
      {/* Modal Desglose Rápido */}
      {quickBreakdownTab && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={() => setQuickBreakdownTab(null)}>
          <div className="bg-zinc-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">
                    {quickBreakdownTab === 'cripto' ? 'Desglose: Criptomonedas' : 
                     quickBreakdownTab === 'acciones' ? 'Desglose: Acciones' : 
                     quickBreakdownTab === 'inmuebles' ? 'Desglose: Inmuebles' : 'Desglose: Liquidez'}
                  </h2>
                </div>
                <button onClick={() => setQuickBreakdownTab(null)} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar space-y-3 mb-6">
                {quickBreakdownTab === 'cripto' && data.cripto.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">{c.name} ({c.symbol}): <span className="text-slate-400 ml-1">{c.amount} {c.symbol}</span></span>
                    <span className="text-sm font-bold text-white">{formatCurrency(c.amount * c.price, true)}</span>
                  </div>
                ))}
                
                {quickBreakdownTab === 'acciones' && data.acciones.map((a: any) => (
                  <div key={a.id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">{a.name} ({a.ticker}): <span className="text-slate-400 ml-1">{a.amount} shares</span></span>
                    <span className="text-sm font-bold text-white">{formatCurrency(a.amount * a.price, true)}</span>
                  </div>
                ))}

                {quickBreakdownTab === 'inmuebles' && data.inmuebles.map((r: any) => (
                  <div key={r.id} className="flex flex-col p-4 bg-slate-900/50 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{r.address}</span>
                      <span className="text-sm font-bold text-emerald-400">{formatCurrency(r.marketValue - r.mortgage, false)} (Neto)</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800/50 pt-2">
                      <span className="text-[11px] text-slate-500 uppercase">Valor Merc.: {formatCurrency(r.marketValue, false)}</span>
                      <span className="text-[11px] text-rose-400/80 uppercase">Hipoteca: -{formatCurrency(r.mortgage, false)}</span>
                    </div>
                  </div>
                ))}

                {quickBreakdownTab === 'liquidez' && data.liquidez.map((l: any) => (
                  <div key={l.id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <span className="text-sm font-medium text-slate-300">{l.entity}</span>
                    <span className="text-sm font-bold text-white">{formatCurrency(l.balance, false)}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setActiveSection(quickBreakdownTab);
                  setQuickBreakdownTab(null);
                }} 
                className="w-full bg-slate-100 hover:bg-white text-slate-900 font-bold p-3 rounded-xl transition-all shadow-lg text-sm flex items-center justify-center gap-2"
              >
                Ver gestión completa <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Añadir Activo</h3>
                  <p className="text-xs text-emerald-500 mt-1 uppercase tracking-widest font-semibold">{getSectionTitle(modalType!)}</p>
                </div>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 p-2 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {renderModalInputs()}
                {modalError && <p className="text-red-500 text-sm mb-3 text-center">{modalError}</p>}
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 mt-6 rounded-xl transition-transform active:scale-95 shadow-lg shadow-emerald-500/20">
                  Guardar Datos
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay (Only on md devices since it's hidden on small screens) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm hidden md:block lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static hidden md:flex ${
          isSidebarOpen ? 'translate-x-0 !flex' : '-translate-x-full'
        }`}
      >
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Briefcase className="w-5 h-5 text-slate-950" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">QuantumCap</span>
          </div>
          <button 
            className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white border-l-2 border-emerald-500 shadow-sm'
                    : 'text-slate-400 hover:text-white border-l-2 border-transparent hover:bg-slate-900/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'currentColor'}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 text-left">
            <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden shrink-0">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=transparent" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Luis Preper</p>
              <p className="text-[10px] text-slate-500 truncate">Premium Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto pb-16 md:pb-0">
        <header className="flex md:hidden items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-950/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Briefcase className="w-4 h-4 text-slate-950" />
            </div>
            <span className="text-lg font-bold text-white">QuantumCap</span>
          </div>
        </header>

        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 h-16 z-50 flex justify-around items-center md:hidden pb-safe">
        <button onClick={() => setActiveSection('resumen')} className={`flex flex-col items-center gap-1 ${activeSection === 'resumen' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Resumen</span>
        </button>
        <button onClick={() => setActiveSection('analitica')} className={`flex flex-col items-center gap-1 ${activeSection === 'analitica' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <LineIcon className="w-5 h-5" />
          <span className="text-[10px]">Analítica</span>
        </button>
        <button onClick={() => setIsMobileAssetsMenuOpen(true)} className={`flex flex-col items-center gap-1 ${['cripto', 'acciones', 'inmuebles', 'liquidez', 'pasivos'].includes(activeSection) ? 'text-emerald-400' : 'text-slate-400'}`}>
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px]">Activos</span>
        </button>
        <button onClick={() => setActiveSection('operaciones')} className={`flex flex-col items-center gap-1 ${activeSection === 'operaciones' ? 'text-emerald-400' : 'text-slate-400'}`}>
          <History className="w-5 h-5" />
          <span className="text-[10px]">Movs.</span>
        </button>
      </nav>

      {/* Mobile Assets Menu Modal */}
      {isMobileAssetsMenuOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm md:hidden" onClick={() => setIsMobileAssetsMenuOpen(false)}>
          <div className="bg-slate-900 border-t border-slate-800 w-full rounded-t-3xl p-6 pb-12 animate-in slide-in-from-bottom-full duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white tracking-tight">Mis Activos</h3>
              <button onClick={() => setIsMobileAssetsMenuOpen(false)} className="text-slate-400 bg-slate-800/50 p-2 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'cripto', name: 'Criptomonedas', icon: Bitcoin, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { id: 'acciones', name: 'Acciones/Fondos', icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { id: 'inmuebles', name: 'Inmuebles', icon: Home, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                { id: 'liquidez', name: 'Liquidez/Cuentas', icon: Wallet, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { id: 'pasivos', name: 'Pasivos y Deudas', icon: CreditCard, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => { setActiveSection(item.id); setIsMobileAssetsMenuOpen(false); }} className="flex flex-col items-center justify-center p-4 bg-slate-950 border border-slate-800 rounded-2xl gap-3">
                    <div className={`p-3 rounded-xl ${item.bg}`}>
                      <Icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="text-xs font-semibold text-white whitespace-nowrap text-center">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
