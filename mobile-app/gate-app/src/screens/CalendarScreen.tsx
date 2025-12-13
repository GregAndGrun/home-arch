import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import SplitScreen from '../components/Layout/SplitScreen';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 48) / 7; // 7 days per week

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date: Date;
}

interface CalendarScreenProps {
  onBack?: () => void;
}

const CalendarScreen: React.FC<CalendarScreenProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Generate calendar events (mock data for now)
  const events: CalendarEvent[] = useMemo(() => {
    const today = new Date();
    const events: CalendarEvent[] = [];
    
    // Add some sample events
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    events.push({
      id: '1',
      title: 'Spotkanie z klientem',
      startTime: '10:00',
      endTime: '11:30',
      date: tomorrow,
    });

    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    events.push({
      id: '2',
      title: 'Prezentacja projektu',
      startTime: '14:00',
      endTime: '15:30',
      date: dayAfter,
    });

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    events.push({
      id: '3',
      title: 'Wizyta u dentysty',
      startTime: '09:00',
      endTime: '10:00',
      date: nextWeek,
    });

    return events.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return a.startTime.localeCompare(b.startTime);
    });
  }, []);

  // Get current month calendar
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentDate]);

  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  const HeaderContent = React.useMemo(() => {
    return (
      <View style={styles.headerTopRow}>
        <View>
          <Text style={[styles.title, { color: '#FFFFFF' }]}>
            Kalendarz
          </Text>
          <Text style={[styles.subtitle, { color: '#FFFFFF', opacity: 0.9 }]}>
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </Text>
        </View>
      </View>
    );
  }, [currentDate]);

  const today = new Date();
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const hasEvent = (date: Date | null) => {
    if (!date) return false;
    return events.some(event => event.date.toDateString() === date.toDateString());
  };

  return (
    <SplitScreen
      headerContent={HeaderContent}
      onBack={onBack}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Calendar Grid */}
        <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
          {/* Day names header */}
          <View style={styles.dayNamesRow}>
            {dayNames.map((dayName, index) => (
              <View key={index} style={[styles.dayNameCell, { width: DAY_WIDTH }]}>
                <Text style={[styles.dayNameText, { color: colors.textSecondary }]}>
                  {dayName}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar days */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((date, index) => {
              const isTodayDate = isToday(date);
              const hasEventForDay = hasEvent(date);
              
              return (
                <View
                  key={index}
                  style={[
                    styles.dayCell,
                    { 
                      width: DAY_WIDTH,
                      backgroundColor: isTodayDate ? colors.accent + '20' : 'transparent',
                    }
                  ]}
                >
                  {date && (
                    <>
                      <Text
                        style={[
                          styles.dayNumber,
                          {
                            color: isTodayDate ? colors.accent : colors.textPrimary,
                            fontFamily: isTodayDate ? typography.fontFamily.bold : typography.fontFamily.regular,
                          }
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                      {hasEventForDay && (
                        <View style={[styles.eventDot, { backgroundColor: colors.accent }]} />
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Upcoming Events List */}
        <View style={styles.eventsSection}>
          <Text style={[styles.eventsTitle, { color: colors.textPrimary }]}>
            Najbliższe wydarzenia
          </Text>
          {events.length === 0 ? (
            <View style={[styles.noEventsContainer, { backgroundColor: colors.card }]}>
              <MaterialIcons name="event-busy" size={48} color={colors.textSecondary} />
              <Text style={[styles.noEventsText, { color: colors.textSecondary }]}>
                Brak nadchodzących wydarzeń
              </Text>
            </View>
          ) : (
            events.map((event) => {
              const eventDate = event.date;
              const isTodayEvent = eventDate.toDateString() === today.toDateString();
              const isTomorrow = (() => {
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return eventDate.toDateString() === tomorrow.toDateString();
              })();

              return (
                <View
                  key={event.id}
                  style={[styles.eventCard, { backgroundColor: colors.card }]}
                >
                  <View style={[styles.eventTimeContainer, { backgroundColor: colors.accent + '20' }]}>
                    <Text style={[styles.eventTime, { color: colors.accent }]}>
                      {event.startTime}
                    </Text>
                    <Text style={[styles.eventTime, { color: colors.accent }]}>
                      {event.endTime}
                    </Text>
                  </View>
                  <View style={styles.eventContent}>
                    <Text style={[styles.eventTitle, { color: colors.textPrimary }]}>
                      {event.title}
                    </Text>
                    <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                      {isTodayEvent
                        ? 'Dzisiaj'
                        : isTomorrow
                        ? 'Jutro'
                        : `${eventDate.getDate()} ${monthNames[eventDate.getMonth()]}`}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    marginTop: 15,
    marginBottom: 12,
    paddingLeft: 30,
    paddingRight: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  calendarContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayNameCell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dayNameText: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    height: DAY_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
  },
  eventDot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  eventsSection: {
    marginTop: 8,
  },
  eventsTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 16,
  },
  eventCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  eventTimeContainer: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 12,
    paddingVertical: 8,
  },
  eventTime: {
    fontSize: 12,
    fontFamily: typography.fontFamily.semiBold,
    lineHeight: 16,
  },
  eventContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: typography.fontFamily.semiBold,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    fontFamily: typography.fontFamily.regular,
  },
  noEventsContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  noEventsText: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    marginTop: 12,
  },
});

export default CalendarScreen;
