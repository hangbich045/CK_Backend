'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

interface BookingEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: any;
}

interface StudioCalendarProps {
  events: BookingEvent[];
  onSelectSlot: (start: Date, end: Date) => void;
  onEventClick?: (event: any) => void;
}

export default function StudioCalendar({ events, onSelectSlot, onEventClick }: StudioCalendarProps) {
  const handleDateClick = (info: any) => {
    if (info.view.type === 'dayGridMonth') {
      const calendarApi = info.view.calendar;
      calendarApi.changeView('timeGridDay', info.date);
    } else {
      const start = info.date;
      const end = new Date(start.getTime() + 30 * 60 * 1000); // 30 mins slot duration
      onSelectSlot(start, end);
    }
  };

  const handleEventClick = (info: any) => {
    // If it's a temp selection slot, clicking it toggles selection too
    if (info.event.extendedProps?.isSelectedSlot) {
      onSelectSlot(info.event.start, info.event.end);
    } else if (onEventClick) {
      onEventClick(info.event);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 shadow-xl bg-black/25">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        selectable={false}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        events={events}
        locale="vi"
        firstDay={1} // Monday
        height="650px"
        buttonText={{
          today: 'Hôm nay',
          month: 'Tháng',
          week: 'Tuần',
          day: 'Ngày',
        }}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
          hour12: false,
        }}
      />
    </div>
  );
}
