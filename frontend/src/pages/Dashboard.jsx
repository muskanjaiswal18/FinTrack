
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  dashboardStyles,
  trendStyles,
  chartStyles,
} from "../assets/dummyStyles";
import {
  GAUGE_COLORS,
  COLORS,
  INCOME_CATEGORY_ICONS,
  EXPENSE_CATEGORY_ICONS,
} from "../assets/color";
import { useOutletContext } from "react-router-dom";
import {
  getTimeFrameRange,
  getPreviousTimeFrameRange,
  calculateData,
} from "../components/Helpers";
import axios from "axios";
import {
  ArrowDown,
  BarChart2,
  ChevronDown,
  TrendingUp as ProfitIcon,
  PieChart as PieChartIcon,
  ChevronUp,
  DollarSign,
  PiggyBank,
  Plus,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import FinancialCard from "../components/FinancialCard";
import GaugeCard from "../components/GaugeCard";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import AddTransactionModal from "../components/Add";
import { API_BASE } from "../config";

const getAuthHeader = () => {
  const token =
    localStorage.getItem("token") || localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token} ` } : {};
};

// to convert date to ISO timeline
function toIsoWithClientTime(dateValue) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch (err) {
    return new Date().toISOString();
  }
}

// Recharts' default pie label placement puts every label at the same
// fixed radius right at the slice edge with no spacing logic, so labels
// from adjacent (especially small) slices overlap each other. This
// custom renderer pushes labels outward along their slice's angle and
// draws a connector line back to the slice, which is the standard fix
// for label collisions in Recharts pie charts. Slices below 5% are
// skipped (the Legend below the chart still lists them) since there
// isn't enough angular room to place readable text without it running
// into its neighbors regardless of offset.
const PIE_LABEL_MIN_PERCENT = 0.05;

const renderPieLabel = (props) => {
  const { cx, cy, midAngle, outerRadius, percent, name } = props;
  if (percent < PIE_LABEL_MIN_PERCENT) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 22;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textAnchor = x > cx ? "start" : "end";

  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      dominantBaseline="central"
      className="text-xs fill-gray-600"
    >
      {`${name}: ${Math.round(percent * 100)}%`}
    </text>
  );
};

const renderPieLabelLine = (props) => {
  const { cx, cy, midAngle, outerRadius, percent } = props;
  if (percent < PIE_LABEL_MIN_PERCENT) return null;

  const RADIAN = Math.PI / 180;
  const innerPoint = {
    x: cx + outerRadius * Math.cos(-midAngle * RADIAN),
    y: cy + outerRadius * Math.sin(-midAngle * RADIAN),
  };
  const outerPoint = {
    x: cx + (outerRadius + 14) * Math.cos(-midAngle * RADIAN),
    y: cy + (outerRadius + 14) * Math.sin(-midAngle * RADIAN),
  };

  return (
    <path
      d={`M${innerPoint.x},${innerPoint.y}L${outerPoint.x},${outerPoint.y}`}
      stroke="#9ca3af"
      strokeWidth={1}
      fill="none"
    />
  );
};

const Dashboard = () => {
  //get refreshTransactions from the outlet context
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    refreshTransactions,
  } = useOutletContext();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overviewMeta, setOverviewMeta] = useState({});
  const [dashboardError, setDashboardError] = useState(null);
  const [showAllIncome, setShowAllIncome] = useState(false); //to toggle
  const [showAllExpense, setShowAllExpense] = useState(false);

  // Guards against out-of-order responses: only the most recently
  // *fired* dashboard-overview request is allowed to update state.
  // Without this, a slower earlier request can resolve after a newer
  // one and silently overwrite fresh data with stale/zeroed values.
  const overviewRequestId = useRef(0);

  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "expense", //or income
    category: "Food",
  });

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame),
    [timeFrame],
  );
  const prevTimeFrameRange = useMemo(
    () => getPreviousTimeFrameRange(timeFrame),
    [timeFrame],
  );

  //function to check if a date is within the range
  const isDateInRange = (date, start, end) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);
    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  };

  //to filter using date and time
  const filteredTransactions = useMemo(
    () =>
      (outletTransactions || []).filter((t) =>
        isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end),
      ),
    [outletTransactions, timeFrameRange],
  );

  const prevFilteredTransactions = useMemo(
    () =>
      (outletTransactions || []).filter((t) =>
        isDateInRange(t.date, prevTimeFrameRange.start, prevTimeFrameRange.end),
      ),
    [outletTransactions, prevTimeFrameRange],
  );

  //calculate data
  const currentTimeFrameData = useMemo(() => {
    const data = calculateData(filteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [filteredTransactions]);

  const prevTimeFrameData = useMemo(() => {
    const data = calculateData(prevFilteredTransactions);
    data.savings = data.income - data.expenses;
    return data;
  }, [prevFilteredTransactions]);

  const displayIncome =
    timeFrame === "monthly" && typeof overviewMeta.monthlyIncome === "number"
      ? overviewMeta.monthlyIncome
      : currentTimeFrameData.income;

  const displayExpenses =
    timeFrame === "monthly" && typeof overviewMeta.monthlyExpense === "number"
      ? overviewMeta.monthlyExpense
      : currentTimeFrameData.expenses;

  const displaySavings =
    timeFrame === "monthly" && typeof overviewMeta.savings === "number"
      ? overviewMeta.savings
      : currentTimeFrameData.savings;

  //expense change percentage
  const expenseChange = useMemo(() => {
    const prev = prevTimeFrameData.expenses;
    const curr = displayExpenses;
    if (!prev) {
      if (!curr) return 0;
      return 100;
    }
    return Math.round(((curr - prev) / prev) * 100);
  }, [prevTimeFrameData, displayExpenses]);

  //expense distribution
  const financialOverviewData = useMemo(() => {
    if (
      timeFrame === "monthly" &&
      overviewMeta.expenseDistribution &&
      Array.isArray(overviewMeta.expenseDistribution) &&
      overviewMeta.expenseDistribution.length > 0
    ) {
      return overviewMeta.expenseDistribution.map((d) => ({
        name: d.category,
        value: Math.round(Number(d.amount) || 0),
      }));
    }

    const categories = {};
    filteredTransactions.forEach((transaction) => {
      if (transaction.type === "expense") {
        categories[transaction.category] =
          (categories[transaction.category] || 0) + transaction.amount;
      }
    });

    return Object.keys(categories).map((category) => ({
      name: category,
      value: Math.round(categories[category]),
    }));
  }, [filteredTransactions, overviewMeta, timeFrame]);

  // build server-provided recent list
  const serverRecent = overviewMeta.recentTransactions || [];
  const serverRecentIncome = serverRecent
    .filter((t) => t.type === "income")
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  const serverRecentExpense = serverRecent
    .filter((t) => t.type === "expense")
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const incomeTransactions = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "income")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions],
  );

  const expenseTransactions = useMemo(
    () =>
      filteredTransactions
        .filter((t) => t.type === "expense")
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [filteredTransactions],
  );

  const incomeListForDisplay =
    timeFrame === "monthly" && serverRecentIncome.length > 0
      ? serverRecentIncome
      : incomeTransactions;

  const expenseListForDisplay =
    timeFrame === "monthly" && serverRecentExpense.length > 0
      ? serverRecentExpense
      : expenseTransactions;

  const displayedIncome = showAllIncome
    ? incomeListForDisplay
    : incomeListForDisplay.slice(0, 3); //show 3 then a toggle button

  const displayedExpense = showAllExpense
    ? expenseListForDisplay
    : expenseListForDisplay.slice(0, 3);

  // fetch the server-side data
  const fetchDashboardOverview = async () => {
    // Stamp this call with a unique, increasing id. Only the response
    // matching the *latest* id is allowed to update state, so a slower
    // older request can never clobber a newer one.
    const requestId = ++overviewRequestId.current;

    try {
      setLoading(true);
      setDashboardError(null);
      const res = await axios.get(`${API_BASE}/dashboard`, {
        headers: getAuthHeader(),
      });

      // A newer request has since been fired — discard this stale result.
      if (requestId !== overviewRequestId.current) return;

      if (res?.data?.success) {
        const data = res.data.data;

        const recent = (data.recentTransactions || []).map((item) => {
          const typeFromServer =
            item.type || (item.category ? "expense" : "income");
          const amountNum = Number(item.amount) || 0;

          const isoDate = item.date
            ? new Date(item.date).toISOString()
            : item.createdAt
              ? new Date(item.createdAt).toISOString()
              : new Date().toISOString();

          return {
            id: item._id || item.id || Date.now() + Math.random(),
            date: isoDate,
            description:
              item.description ||
              item.note ||
              item.title ||
              (typeFromServer === "income"
                ? item.source || "Income"
                : item.category || "Expense"),
            amount: amountNum,
            type: typeFromServer,
            category:
              item.category ||
              (typeFromServer === "income" ? "Salary" : "Other"),
            raw: item,
          };
        });

        setOverviewMeta((prev) => ({
          ...prev,
          monthlyIncome: Number(data.monthlyIncome || 0),
          monthlyExpense: Number(data.monthlyExpense || 0),
          savings:
            typeof data.savings !== "undefined"
              ? Number(data.savings)
              : Number(data.monthlyIncome || 0) -
                Number(data.monthlyExpense || 0),
          savingsRate:
            typeof data.savingsRate !== "undefined" ? data.savingsRate : null,
          spendByCategory: data.spendByCategory || {},
          expenseDistribution: data.expenseDistribution || [],
          recentTransactions: recent,
        }));
      } else {
        console.warn("Dashboard endpoint returned success:false", res?.data);
        setDashboardError("Could not load dashboard data. Please refresh.");
      }
    } catch (err) {
      if (requestId !== overviewRequestId.current) return;
      console.error(
        "Failed to fetch dashboard overview:",
        err?.response || err.message || err,
      );
      setDashboardError(
        "Could not load dashboard data. Please check your connection and refresh.",
      );
    } finally {
      if (requestId === overviewRequestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardOverview();
  }, []);

  // Single source of truth for the gauges: derived directly from the same
  // displayIncome/displayExpenses/displaySavings values the summary cards
  // use, so gauges and cards can never disagree or race against each other.
  const gaugeData = useMemo(() => {
    const maxValues = {
      income: Math.max(displayIncome, 5000),
      expenses: Math.max(displayExpenses, 3000),
      savings: Math.max(Math.abs(displaySavings), 2000),
    };

    return [
      { name: "Income", value: displayIncome, max: maxValues.income },
      { name: "Spent", value: displayExpenses, max: maxValues.expenses },
      { name: "Savings", value: displaySavings, max: maxValues.savings },
    ];
  }, [displayIncome, displayExpenses, displaySavings]);

  // add/ edit or //delete
  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    const payload = {
      date: toIsoWithClientTime(newTransaction.date),
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      category: newTransaction.category,
    };

    try {
      setLoading(true);
      if (newTransaction.type === "income") {
        await axios.post(`${API_BASE}/income/add`, payload, {
          headers: getAuthHeader(),
        });
      } else {
        await axios.post(`${API_BASE}/expense/add`, payload, {
          headers: getAuthHeader(),
        });
      }
      await refreshTransactions();
      await fetchDashboardOverview();

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "expense",
        category: "Food",
      });
      setShowModal(false);
    } catch (err) {
      console.error(
        "Failed to add Transactions:",
        err?.response || err.message || err,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={dashboardStyles.container}>
      {/* Header */}
      <div className={dashboardStyles.headerContainer}>
        <div className={dashboardStyles.headerContent}>
          <div>
            <h1 className={dashboardStyles.headerTitle}>Finance Dashboard</h1>
            <p className={dashboardStyles.headerSubtitle}>
              Track your income and expenses
            </p>
            {dashboardError && (
              <p className="text-sm text-red-500 mt-1">
                {dashboardError}{" "}
                <button
                  type="button"
                  onClick={fetchDashboardOverview}
                  className="underline"
                >
                  Retry
                </button>
              </p>
            )}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={dashboardStyles.addButton}
          >
            <Plus size={20} />
            Add Transaction
          </button>
        </div>

        <div className={dashboardStyles.timeFrameContainer}>
          <div className={dashboardStyles.timeFrameWrapper}>
            {["daily", "weekly", "monthly"].map((frame) => (
              <button
                key={frame}
                onClick={() => setTimeFrame(frame)}
                className={dashboardStyles.timeFrameButton(timeFrame === frame)}
              >
                {frame.charAt(0).toUpperCase() + frame.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={dashboardStyles.summaryGrid}>
        <FinancialCard
          icon={
            <div className={dashboardStyles.walletIconContainer}>
              <Wallet className=" w-5 h-5 text-teal-600" />
            </div>
          }
          label="Total Balance"
          value={`$${Math.round(displayIncome - displayExpenses).toLocaleString()}`}
          additionalContent={
            <div className=" flex items-center gap-2 mt-2 text-sm">
              <span className={dashboardStyles.balanceBadge}>
                +${Math.round(displayIncome).toLocaleString()}
              </span>
              <span className={dashboardStyles.expenseBadge}>
                -${Math.round(displayExpenses).toLocaleString()}
              </span>
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={dashboardStyles.arrowDownIconContainer}>
              <ArrowDown className=" w-5 h-5 text-orange-600" />
            </div>
          }
          label={`${timeFrameRange.label} Expenses`}
          value={`$${Math.round(displayExpenses).toLocaleString()}`}
          additionalContent={
            <div
              className={`mt-2 text-xs flex items-center gap-1 ${
                expenseChange >= 0 ? trendStyles.positive : trendStyles.negative
              }`}
            >
              {expenseChange >= 0 ? (
                <TrendingUp className=" w-4 h-4" />
              ) : (
                <TrendingDown className=" w-4 h-4" />
              )}
              <span>
                {Math.abs(expenseChange)}%{" "}
                {expenseChange >= 0 ? "increase" : "decrease"} from{" "}
                {prevTimeFrameRange.label}
              </span>
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={dashboardStyles.piggyBankIconContainer}>
              <PiggyBank className=" w-5 h-5 text-cyan-600" />
            </div>
          }
          label={`${timeFrameRange.label} Savings`}
          value={`$${Math.round(displaySavings).toLocaleString()}`}
          additionalContent={
            <div className=" mt-2 text-xs text-cyan-600 flex items-center gap-2">
              <div className=" flex items-center gap-1">
                <BarChart2 className=" w-4 h-4" />
                <span>
                  {displayIncome > 0
                    ? Math.round((displaySavings / displayIncome) * 100)
                    : 0}
                  % of income
                </span>
              </div>

              {typeof overviewMeta.savingsRate === "number" && (
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    overviewMeta.savingsRate < 0
                      ? trendStyles.negativeRate
                      : trendStyles.positiveRate
                  }`}
                >
                  {overviewMeta.savingsRate}%
                </span>
              )}
            </div>
          }
        />
      </div>

      {/* Gauges */}
      <div className={dashboardStyles.gaugeGrid}>
        {gaugeData.map((gauge) => (
          <GaugeCard
            key={gauge.name}
            gauge={gauge}
            colorInfo={GAUGE_COLORS[gauge.name]}
            timeFrameLabel={timeFrameRange.label}
          />
        ))}
      </div>

      {/* Expense distribution pie - Hidden on mobile */}
      <div className={dashboardStyles.pieChartContainer}>
        <div className={dashboardStyles.pieChartHeader}>
          <h3 className={dashboardStyles.pieChartTitle}>
            <PieChartIcon className="w-6 h-6 text