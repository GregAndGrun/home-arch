import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import SplitScreen from '../components/Layout/SplitScreen';
import AppCategoryHeader from '../components/AppCategoryHeader';
import CategoryHeader from '../components/CategoryHeader';
import DevicesListContent from '../components/DevicesListContent';
import { useTheme } from '../theme/useTheme';
import { typography } from '../theme/typography';
import { StorageService } from '../services/StorageService';
import { DeviceCategory } from '../types';

const { width } = Dimensions.get('window');
const DAY_WIDTH = (width - 48) / 7; // 7 days per week

export type AppCategory = 'smart-home' | 'calendar' | 'notes' | 'shopping-list';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date: Date;
}

interface AppCategoriesScreenProps {
  onCategoryPress: (category: AppCategory) => void;
  selectedCategory?: AppCategory | null;
  onDevicePress?: (device: any) => void;
  onSmartHomeCategorySelect?: (category: DeviceCategory | 'all') => void;
}

const AppCategoriesScreen: React.FC<AppCategoriesScreenProps> = ({ 
  onCategoryPress, 
  selectedCategory = 'calendar',
  onDevicePress,
  onSmartHomeCategorySelect,
}) => {
  const { colors } = useTheme();
  const [username, setUsername] = useState('Użytkownik');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [smartHomeCategory, setSmartHomeCategory] = useState<DeviceCategory | 'all'>('all');

  useEffect(() => {
    loadUsername();
  }, []);

  const loadUsername = async () => {
    try {
      const name = await StorageService.getUsername();
      setUsername(name || 'Użytkownik');
    } catch (error) {
      console.error('Error loading username:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Dzień dobry';
    if (hour >= 12 && hour < 18) return 'Dobry wieczór';
    return 'Dobry wieczór';
  };

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
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // Convert to Monday = 0, Tuesday = 1, ..., Sunday = 6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek < 0) startingDayOfWeek = 6; // Sunday becomes 6

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

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
  const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];

  const today = new Date();
  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  };

  const hasEvent = (date: Date | null) => {
    if (!date) return false;
    return events.some(event => event.date.toDateString() === date.toDateString());
  };

  const HeaderContent = React.useMemo(() => {
    const getSubtitle = () => {
      if (selectedCategory === 'calendar') {
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      } else if (selectedCategory === 'smart-home') {
        return 'Sterowanie urządzeniami';
      } else if (selectedCategory === 'shopping-list') {
        return 'Twoje zakupy i produkty';
      } else if (selectedCategory === 'notes') {
        return 'Twoje notatki i zapiski';
      }
      return 'Wybierz kategorię aplikacji';
    };

    return (
      <View style={styles.headerTopRow}>
        <View style={styles.headerContent}>
          <Text style={[styles.greeting, { color: '#FFFFFF' }]}>
            {getGreeting()}, {username}!
          </Text>
          <Text style={[styles.subGreeting, { color: '#FFFFFF', opacity: 0.9 }]}>
            {getSubtitle()}
          </Text>
        </View>
        {selectedCategory === 'smart-home' ? (
          <CategoryHeader
            selectedCategory={smartHomeCategory}
            onSelectCategory={(cat) => {
              setSmartHomeCategory(cat);
              // Don't call onSmartHomeCategorySelect - we're already in Smart Home
              // Just update the category to show different devices
            }}
            onBack={() => {
              // Return to main menu (calendar)
              onCategoryPress('calendar');
            }}
          />
        ) : (
          <AppCategoryHeader
            selectedCategory={selectedCategory}
            onSelectCategory={onCategoryPress}
          />
        )}
      </View>
    );
  }, [username, selectedCategory, currentDate, smartHomeCategory, onCategoryPress, onSmartHomeCategorySelect]);

  const renderContent = () => {
    if (selectedCategory === 'calendar') {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Calendar Grid */}
          <View style={[styles.calendarContainer, { backgroundColor: colors.card }]}>
            {/* Month navigation */}
            <View style={styles.monthNavigation}>
              <TouchableOpacity
                onPress={() => changeMonth('prev')}
                style={styles.monthButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="chevron-left" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </Text>
              <TouchableOpacity
                onPress={() => changeMonth('next')}
                style={styles.monthButton}
                activeOpacity={0.7}
              >
                <MaterialIcons name="chevron-right" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
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
      );
    } else if (selectedCategory === 'smart-home') {
      // Render smart home content inline
      return (
        <DevicesListContent
          category={smartHomeCategory}
          onDevicePress={onDevicePress || (() => {})}
        />
      );
    } else if (selectedCategory === 'shopping-list') {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={[styles.placeholderContainer, { backgroundColor: colors.card }]}>
            <MaterialIcons name="shopping-cart" size={64} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Lista zakupów wkrótce
            </Text>
            <Text style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              Funkcjonalność listy zakupów będzie dostępna w przyszłej wersji
            </Text>
          </View>
        </ScrollView>
      );
    } else if (selectedCategory === 'notes') {
      return (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={[styles.placeholderContainer, { backgroundColor: colors.card }]}>
            <MaterialIcons name="note" size={64} color={colors.textSecondary} />
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Notatki wkrótce
            </Text>
            <Text style={[styles.placeholderSubtext, { color: colors.textSecondary }]}>
              Funkcjonalność notatek będzie dostępna w przyszłej wersji
            </Text>
          </View>
        </ScrollView>
      );
    }

    return null;
  };

  return (
    <SplitScreen
      headerContent={HeaderContent}
    >
      {renderContent()}
    </SplitScreen>
  );
};

const styles = StyleSheet.create({
  headerTopRow: {
    marginTop: 15,
    marginBottom: 12,
  },
  headerContent: {
    paddingLeft: 30,
    paddingRight: 10,
    marginBottom: 8,
  },
  greeting: {
    fontSize: 24,
    fontFamily: typography.fontFamily.bold,
    marginBottom: 4,
  },
  subGreeting: {
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
  monthNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  monthButton: {
    padding: 8,
    borderRadius: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
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
  placeholderContainer: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    marginTop: 40,
  },
  placeholderText: {
    fontSize: 20,
    fontFamily: typography.fontFamily.semiBold,
    marginTop: 16,
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 14,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});

export default AppCategoriesScreen;
