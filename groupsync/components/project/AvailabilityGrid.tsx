'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DAYS_OF_WEEK,
  HALF_HOURS,
  createAvailabilityGrid,
  gridToSlots,
  formatHour,
  getDayHeaderWithDate,
  type TimeSlot,
} from './availability-utils';

interface AvailabilityGridProps {
  slots: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
  readonly?: boolean;
}

// Show hours from 6 AM to 11 PM for better UX (in 30-minute increments)
const DISPLAY_HALF_HOURS = HALF_HOURS.filter(h => h >= 6 && h < 23);

export function AvailabilityGrid({ slots, onChange, readonly = false }: AvailabilityGridProps) {
  const [grid, setGrid] = useState<boolean[][]>(() => createAvailabilityGrid(slots));
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'select' | 'deselect'>('select');
  const [hoveredSlot, setHoveredSlot] = useState<{ day: number; hour: number } | null>(null);
  const [dragStartSlot, setDragStartSlot] = useState<{ day: number; hour: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const updateGrid = useCallback(
    (newGrid: boolean[][]) => {
      setGrid(newGrid);
      const newSlots = gridToSlots(newGrid);
      onChange(newSlots);
    },
    [onChange]
  );

  const toggleCell = useCallback(
    (day: number, hour: number) => {
      if (readonly) return;

      const newGrid = grid.map((row) => [...row]);
      const currentValue = newGrid[day][hour];
      newGrid[day][hour] = !currentValue;
      updateGrid(newGrid);
    },
    [grid, readonly, updateGrid]
  );

  const handleMouseDown = useCallback(
    (day: number, hour: number) => {
      if (readonly) return;

      setIsDragging(true);
      setDragStartSlot({ day, hour });
      const currentValue = grid[day][hour];
      setDragMode(currentValue ? 'deselect' : 'select');

      const newGrid = grid.map((row) => [...row]);
      newGrid[day][hour] = !currentValue;
      updateGrid(newGrid);
    },
    [grid, readonly, updateGrid]
  );

  const handleMouseEnter = useCallback(
    (day: number, hour: number) => {
      setHoveredSlot({ day, hour });

      if (!isDragging || readonly) return;

      const newGrid = grid.map((row) => [...row]);
      newGrid[day][hour] = dragMode === 'select';
      updateGrid(newGrid);
    },
    [isDragging, dragMode, grid, readonly, updateGrid]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredSlot(null);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartSlot(null);
  }, []);

  const getTimeRangeDisplay = () => {
    if (!dragStartSlot || !hoveredSlot || dragStartSlot.day !== hoveredSlot.day) return null;

    const startHour = Math.min(dragStartSlot.hour / 2, hoveredSlot.hour / 2);
    const endHour = Math.max(dragStartSlot.hour / 2, hoveredSlot.hour / 2) + 0.5;

    return `${DAYS_OF_WEEK[dragStartSlot.day]}: ${formatHour(startHour)} - ${formatHour(endHour)}`;
  };

  const clearAll = useCallback(() => {
    const emptyGrid = Array.from({ length: 7 }, () => Array(48).fill(false));
    updateGrid(emptyGrid);
  }, [updateGrid]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Select Your Availability</CardTitle>
          {!readonly && (
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          )}
        </div>
        <p className="text-sm text-slate-600">
          {readonly ? 'Viewing availability' : 'Click and drag to select your available hours'}
        </p>
        {/* Fixed height container to prevent layout shift */}
        <div className="mt-2 h-9">
          {getTimeRangeDisplay() && (
            <div className="px-3 py-2 bg-blue-100 text-blue-900 rounded-md text-sm font-medium">
              {getTimeRangeDisplay()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={gridRef}
          className="overflow-x-auto"
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            handleMouseUp();
            handleMouseLeave();
          }}
        >
          <div className="inline-block min-w-full border border-slate-200 rounded-lg overflow-hidden">
            {/* Header Row - Days */}
            <div className="grid grid-cols-8">
              <div className="bg-slate-50 border-b border-r border-slate-200 p-2 text-xs font-medium text-slate-600">Time</div>
              {DAYS_OF_WEEK.map((day, idx) => (
                <div key={day} className={`bg-slate-50 border-b border-slate-200 p-2 text-xs font-medium text-center text-slate-900 ${idx < 6 ? 'border-r' : ''}`}>
                  {getDayHeaderWithDate(idx)}
                </div>
              ))}
            </div>

            {/* Time Slots Grid */}
            <div className="grid grid-cols-8">
              {DISPLAY_HALF_HOURS.map((halfHour, hourIdx) => {
                const halfHourIndex = Math.floor(halfHour * 2);
                const isFullHour = halfHour % 1 === 0;

                return (
                  <React.Fragment key={halfHour}>
                    {/* Time Label (only show on the hour) */}
                    <div className={`h-4 bg-white text-xs text-slate-600 flex items-center border-r border-slate-200 ${isFullHour ? 'p-1 font-bold border-t-2 border-t-slate-300' : ''}`}>
                      {isFullHour ? formatHour(halfHour) : ''}
                    </div>

                    {/* Day Cells */}
                    {DAYS_OF_WEEK.map((_, day) => {
                      const isAvailable = grid[day]?.[halfHourIndex] || false;
                      return (
                        <div
                          key={`${day}-${halfHourIndex}`}
                          className={`
                            h-4 cursor-pointer transition-colors select-none
                            ${isAvailable ? 'bg-blue-500 hover:bg-blue-600' : 'bg-white hover:bg-slate-100'}
                            ${readonly ? 'cursor-default' : ''}
                            ${isFullHour ? 'border-t-2 border-t-slate-300' : ''}
                          `}
                          onMouseDown={() => handleMouseDown(day, halfHourIndex)}
                          onMouseEnter={() => handleMouseEnter(day, halfHourIndex)}
                        />
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-blue-500 rounded" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-white border border-slate-200 rounded" />
            <span>Unavailable</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
