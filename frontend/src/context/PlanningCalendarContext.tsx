import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  PlanningCalendarMode,
  PlanningCalendarState,
  getWeekRange,
  getMonthRange,
  formatDisplayRange,
  formatDateStr,
} from '../types/planningCalendar';

interface PlanningCalendarContextValue {
  state: PlanningCalendarState;
  setMode: (mode: PlanningCalendarMode) => void;
  selectDay: (date: string) => void;
  toggleDate: (date: string) => void;
  selectWeek: (dateInWeek: string) => void;
  selectMonth: (year: number, monthIndex: number) => void;
  setToday: () => void;
  clearSelection: () => void;
  applyState: (newState: PlanningCalendarState) => void;
  horizonDays: number;
}

// Operational reference date: 18 Sep 2026
export const OPERATIONAL_TODAY = '2026-09-18';

// Initial state: 7-day tactical operational window (week of 14-20 Sep 2026)
const defaultWeek = getWeekRange(OPERATIONAL_TODAY);
const initialState: PlanningCalendarState = {
  mode: 'week',
  selectedDates: defaultWeek.dates,
  startDate: defaultWeek.startDate,
  endDate: defaultWeek.endDate,
  displayText: formatDisplayRange('week', defaultWeek.dates, defaultWeek.startDate, defaultWeek.endDate),
  horizonDays: 7,
};

const PlanningCalendarContext = createContext<PlanningCalendarContextValue | undefined>(undefined);

interface ProviderProps {
  children: React.ReactNode;
  onHorizonChange?: (days: number) => void;
}

export const PlanningCalendarProvider: React.FC<ProviderProps> = ({ children, onHorizonChange }) => {
  const [state, setState] = useState<PlanningCalendarState>(initialState);

  const notifyHorizonChange = useCallback(
    (days: number) => {
      if (onHorizonChange) {
        onHorizonChange(days);
      }
    },
    [onHorizonChange]
  );

  const selectDay = useCallback(
    (date: string) => {
      const newState: PlanningCalendarState = {
        mode: 'day',
        selectedDates: [date],
        startDate: date,
        endDate: date,
        displayText: formatDisplayRange('day', [date], date, date),
        horizonDays: 1,
      };
      setState(newState);
      notifyHorizonChange(1);
    },
    [notifyHorizonChange]
  );

  const toggleDate = useCallback(
    (date: string) => {
      setState((prev) => {
        let newDates: string[];
        if (prev.mode !== 'multi-day') {
          newDates = [date];
        } else {
          newDates = prev.selectedDates.includes(date)
            ? prev.selectedDates.filter((d) => d !== date)
            : [...prev.selectedDates, date];
        }
        newDates.sort();
        const start = newDates.length > 0 ? newDates[0] : null;
        const end = newDates.length > 0 ? newDates[newDates.length - 1] : null;
        const horizon = Math.max(1, Math.min(30, newDates.length));
        const next: PlanningCalendarState = {
          mode: 'multi-day',
          selectedDates: newDates,
          startDate: start,
          endDate: end,
          displayText: formatDisplayRange('multi-day', newDates, start, end),
          horizonDays: horizon,
        };
        notifyHorizonChange(horizon);
        return next;
      });
    },
    [notifyHorizonChange]
  );

  const selectWeek = useCallback(
    (dateInWeek: string) => {
      const range = getWeekRange(dateInWeek);
      const newState: PlanningCalendarState = {
        mode: 'week',
        selectedDates: range.dates,
        startDate: range.startDate,
        endDate: range.endDate,
        displayText: formatDisplayRange('week', range.dates, range.startDate, range.endDate),
        horizonDays: 7,
      };
      setState(newState);
      notifyHorizonChange(7);
    },
    [notifyHorizonChange]
  );

  const selectMonth = useCallback(
    (year: number, monthIndex: number) => {
      const range = getMonthRange(year, monthIndex);
      const newState: PlanningCalendarState = {
        mode: 'month',
        selectedDates: range.dates,
        startDate: range.startDate,
        endDate: range.endDate,
        displayText: formatDisplayRange('month', range.dates, range.startDate, range.endDate),
        horizonDays: 30,
      };
      setState(newState);
      notifyHorizonChange(30);
    },
    [notifyHorizonChange]
  );

  const setToday = useCallback(() => {
    selectDay(OPERATIONAL_TODAY);
  }, [selectDay]);

  const clearSelection = useCallback(() => {
    const newState: PlanningCalendarState = {
      mode: 'day',
      selectedDates: [],
      startDate: null,
      endDate: null,
      displayText: 'No dates selected',
      horizonDays: 7,
    };
    setState(newState);
    notifyHorizonChange(7);
  }, [notifyHorizonChange]);

  const setMode = useCallback((mode: PlanningCalendarMode) => {
    setState((prev) => {
      if (mode === prev.mode) return prev;
      const refDate = prev.startDate || OPERATIONAL_TODAY;
      let next: PlanningCalendarState;
      if (mode === 'day') {
        next = {
          mode: 'day',
          selectedDates: [refDate],
          startDate: refDate,
          endDate: refDate,
          displayText: formatDisplayRange('day', [refDate], refDate, refDate),
          horizonDays: 1,
        };
        notifyHorizonChange(1);
      } else if (mode === 'week') {
        const w = getWeekRange(refDate);
        next = {
          mode: 'week',
          selectedDates: w.dates,
          startDate: w.startDate,
          endDate: w.endDate,
          displayText: formatDisplayRange('week', w.dates, w.startDate, w.endDate),
          horizonDays: 7,
        };
        notifyHorizonChange(7);
      } else if (mode === 'month') {
        const parts = refDate.split('-').map(Number);
        const m = getMonthRange(parts[0], parts[1] - 1);
        next = {
          mode: 'month',
          selectedDates: m.dates,
          startDate: m.startDate,
          endDate: m.endDate,
          displayText: formatDisplayRange('month', m.dates, m.startDate, m.endDate),
          horizonDays: 30,
        };
        notifyHorizonChange(30);
      } else {
        // multi-day
        const initialDates = prev.selectedDates.length > 0 ? prev.selectedDates : [refDate];
        next = {
          mode: 'multi-day',
          selectedDates: initialDates,
          startDate: initialDates[0],
          endDate: initialDates[initialDates.length - 1],
          displayText: formatDisplayRange('multi-day', initialDates, initialDates[0], initialDates[initialDates.length - 1]),
          horizonDays: Math.max(1, Math.min(30, initialDates.length)),
        };
        notifyHorizonChange(next.horizonDays);
      }
      return next;
    });
  }, [notifyHorizonChange]);

  const applyState = useCallback(
    (newState: PlanningCalendarState) => {
      setState(newState);
      notifyHorizonChange(newState.horizonDays);
    },
    [notifyHorizonChange]
  );

  const value = useMemo(
    () => ({
      state,
      setMode,
      selectDay,
      toggleDate,
      selectWeek,
      selectMonth,
      setToday,
      clearSelection,
      applyState,
      horizonDays: state.horizonDays,
    }),
    [state, setMode, selectDay, toggleDate, selectWeek, selectMonth, setToday, clearSelection, applyState]
  );

  return (
    <PlanningCalendarContext.Provider value={value}>
      {children}
    </PlanningCalendarContext.Provider>
  );
};

export function usePlanningCalendar(): PlanningCalendarContextValue {
  const context = useContext(PlanningCalendarContext);
  if (!context) {
    throw new Error('usePlanningCalendar must be used within a PlanningCalendarProvider');
  }
  return context;
}
