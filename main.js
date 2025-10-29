// DOM Elements
const habits = document.querySelectorAll('.habit-btn');
const themeBtn = document.querySelector('#theme');
const modalContainer = document.querySelector('.modal-container');
const habitContainer = document.querySelector('.habit-container');
const createHabitBtn = document.querySelector('.new-habit__add');
const newHabitTitle = document.querySelector('#title');
const icons = document.querySelectorAll('.icon');
const addBtn = document.querySelector('#add');
const cancelBtn = document.querySelector('#cancel');
const deleteBtn = document.querySelector('#delete');
const contextMenu = document.querySelector('.context-menu');

// Calendar Elements
const calendarContainer = document.querySelector('.calendar-container') || createCalendarContainer();
const currentMonthElement = document.querySelector('.current-month') || createCurrentMonthElement();
const calendarGrid = document.querySelector('.calendar-grid') || createCalendarGrid();
const progressContainer = document.querySelector('.progress-container') || createProgressContainer();

// Global Variables
let habitToBeDeleted;
let currentDate = new Date();
let selectedDate = new Date().toDateString();

// Create calendar elements if they don't exist
function createCalendarContainer() {
  const container = document.createElement('div');
  container.className = 'calendar-container';
  document.body.appendChild(container);
  return container;
}

function createCurrentMonthElement() {
  const element = document.createElement('div');
  element.className = 'current-month';
  calendarContainer.appendChild(element);
  return element;
}

function createCalendarGrid() {
  const grid = document.createElement('div');
  grid.className = 'calendar-grid';
  calendarContainer.appendChild(grid);
  return grid;
}

function createProgressContainer() {
  const container = document.createElement('div');
  container.className = 'progress-container';
  document.body.appendChild(container);
  return container;
}

// FUNCTIONS

const storage = {
  saveTheme(value) {
    localStorage.setItem('habitsapp.theme', `${value}`);
  },
  checkTheme() {
    return localStorage.getItem('habitsapp.theme');
  },
  saveHabit(habit) {
    const currentHabits = storage.getHabits();
    currentHabits.push(habit);
    localStorage.setItem('habitsapp.habits', JSON.stringify(currentHabits));
  },
  getHabits() {
    const stored = localStorage.getItem('habitsapp.habits');
    return stored ? JSON.parse(stored) : [];
  },
  updateHabit(updatedHabit) {
    const currentHabits = storage.getHabits();
    const index = currentHabits.findIndex(habit => habit.id === updatedHabit.id);
    if (index !== -1) {
      currentHabits[index] = updatedHabit;
      localStorage.setItem('habitsapp.habits', JSON.stringify(currentHabits));
    }
  },
  deleteHabit(id) {
    const currentHabits = storage.getHabits();
    const updatedHabits = currentHabits.filter(habit => habit.id !== Number(id));
    localStorage.setItem('habitsapp.habits', JSON.stringify(updatedHabits));
  },

  // Calendar and completion tracking
  saveHabitCompletion(habitId, date, completed) {
    const key = `habitsapp.completion.${habitId}.${date}`;
    localStorage.setItem(key, completed.toString());
  },
  getHabitCompletion(habitId, date) {
    const key = `habitsapp.completion.${habitId}.${date}`;
    const stored = localStorage.getItem(key);
    return stored === 'true';
  },
  getHabitCompletionsForMonth(habitId, year, month) {
    const completions = {};
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day).toDateString();
      completions[date] = storage.getHabitCompletion(habitId, date);
    }
    return completions;
  },
  getAllCompletionsForDate(date) {
    const habits = storage.getHabits();
    const completions = {};

    habits.forEach(habit => {
      completions[habit.id] = storage.getHabitCompletion(habit.id, date);
    });

    return completions;
  }
}

const ui = {
  theme() {
    themeBtn.classList.toggle('dark');
    const root = document.querySelector(':root');
    root.classList.toggle('dark');
    themeBtn.classList.contains('dark')
      ? storage.saveTheme('dark')
      : storage.saveTheme('light');
  },
  openModal() {
    modalContainer.classList.add('active');
    modalContainer.setAttribute('aria-hidden', 'false');
    newHabitTitle.focus();
  },
  closeModal() {
    modalContainer.classList.remove('active');
    modalContainer.setAttribute('aria-hidden', 'true');
    newHabitTitle.value = '';
    ui.removeSelectedIcon();
  },
  removeSelectedIcon() {
    icons.forEach(icon => {
      icon.classList.remove('selected');
    })
  },
  addNewHabit(title, icon, id) {
    const isCompleted = storage.getHabitCompletion(id, selectedDate);
    const habitDiv = document.createElement('div');
    habitDiv.classList.add('habit');
    habitDiv.innerHTML = `
      <button class="habit-btn ${isCompleted ? 'completed' : ''}" data-id="${id}" data-title="${title}">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          ${icon}
        </svg>
        <span class="habit-title">${title}</span>
      </button>
    `;
    habitContainer.appendChild(habitDiv);
  },
  refreshHabits() {
    const uiHabits = document.querySelectorAll('.habit');
    uiHabits.forEach(habit => habit.remove());
    const currentHabits = storage.getHabits();

    currentHabits.forEach(habit => {
      ui.addNewHabit(habit.title, habit.icon, habit.id);
    });

    ui.updateProgress();
  },
  deleteHabit() {
    ui.refreshHabits();
    ui.renderCalendar();
  },

  // Calendar UI functions
  renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    currentMonthElement.innerHTML = `
      <button id="prevMonth">&lt;</button>
      <span>${monthNames[month]} ${year}</span>
      <button id="nextMonth">&gt;</button>
    `;

    // Clear calendar grid
    calendarGrid.innerHTML = '';

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
      const dayHeader = document.createElement('div');
      dayHeader.className = 'day-header';
      dayHeader.textContent = day;
      calendarGrid.appendChild(dayHeader);
    });

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarGrid.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      const dayDate = new Date(year, month, day);
      const dateString = dayDate.toDateString();

      dayElement.className = 'calendar-day';
      dayElement.textContent = day;
      dayElement.dataset.date = dateString;

      // Highlight today
      if (dateString === new Date().toDateString()) {
        dayElement.classList.add('today');
      }

      // Highlight selected date
      if (dateString === selectedDate) {
        dayElement.classList.add('selected');
      }

      // Add completion indicator
      const completions = storage.getAllCompletionsForDate(dateString);
      const habits = storage.getHabits();
      const totalHabits = habits.length;
      const completedHabits = Object.values(completions).filter(Boolean).length;

      if (totalHabits > 0) {
        const percentage = Math.round((completedHabits / totalHabits) * 100);
        dayElement.style.setProperty('--completion', `${percentage}%`);

        if (percentage === 100) {
          dayElement.classList.add('fully-completed');
        } else if (percentage > 0) {
          dayElement.classList.add('partially-completed');
        }
      }

      calendarGrid.appendChild(dayElement);
    }

    // Add event listeners for navigation
    document.getElementById('prevMonth')?.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      ui.renderCalendar();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      ui.renderCalendar();
    });
  },

  updateProgress() {
    const habits = storage.getHabits();
    const totalHabits = habits.length;

    if (totalHabits === 0) {
      progressContainer.innerHTML = '<p>No habits yet. Create your first habit!</p>';
      return;
    }

    const completions = storage.getAllCompletionsForDate(selectedDate);
    const completedHabits = Object.values(completions).filter(Boolean).length;
    const percentage = Math.round((completedHabits / totalHabits) * 100);

    progressContainer.innerHTML = `
      <div class="progress-header">
        <h3>Progress for ${new Date(selectedDate).toLocaleDateString()}</h3>
        <span class="progress-percentage">${percentage}%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-stats">
        <span>${completedHabits} of ${totalHabits} habits completed</span>
      </div>
    `;
  }
}

// EVENT LISTENERS

// EVENT: window load
window.addEventListener('DOMContentLoaded', () => {
  // Load theme
  const theme = storage.checkTheme();
  if (theme === 'dark') ui.theme();

  // Initialize UI
  ui.refreshHabits();
  ui.renderCalendar();
  ui.updateProgress();
});

// EVENT: theme button
themeBtn.addEventListener('click', ui.theme);

// EVENT: add habit btn
createHabitBtn.addEventListener('click', ui.openModal);

// EVENT: close modal
cancelBtn.addEventListener('click', ui.closeModal);

// EVENT: selected icon
icons.forEach(icon => {
  icon.addEventListener('click', () => {
    ui.removeSelectedIcon();
    icon.classList.add('selected');
  });
});

// EVENT: add new habit btn
addBtn.addEventListener('click', () => {
  const habitTitle = newHabitTitle.value.trim();

  if (!habitTitle) {
    alert('Please enter a habit title');
    return;
  }

  let habitIcon;
  icons.forEach(icon => {
    if (!icon.classList.contains('selected')) return;
    habitIcon = icon.querySelector('svg').innerHTML;
  });

  if (!habitIcon) {
    alert('Please select an icon');
    return;
  }

  const habitID = Date.now();
  const habit = {
    title: habitTitle,
    icon: habitIcon,
    id: habitID,
    createdAt: new Date().toISOString()
  };

  storage.saveHabit(habit);
  ui.refreshHabits();
  ui.renderCalendar();
  ui.closeModal();
});

// EVENT: complete habit
habitContainer.addEventListener('click', e => {
  const habitBtn = e.target.closest('.habit-btn');
  if (!habitBtn) return;

  const habitId = Number(habitBtn.dataset.id);
  const isCurrentlyCompleted = habitBtn.classList.contains('completed');

  // Toggle completion
  habitBtn.classList.toggle('completed');

  // Save completion status for selected date
  storage.saveHabitCompletion(habitId, selectedDate, !isCurrentlyCompleted);

  // Update progress and calendar
  ui.updateProgress();
  ui.renderCalendar();
});

// EVENT: calendar day selection
document.addEventListener('click', e => {
  if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('empty')) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });

    // Add selection to clicked day
    e.target.classList.add('selected');
    selectedDate = e.target.dataset.date;

    // Refresh habits for selected date
    ui.refreshHabits();
  }
});

// Event: context menu
habitContainer.addEventListener('contextmenu', e => {
  const habitBtn = e.target.closest('.habit-btn');
  if (!habitBtn) return;

  e.preventDefault();
  habitToBeDeleted = habitBtn.dataset.id;
  const { clientX: mouseX, clientY: mouseY } = e;
  contextMenu.style.top = `${mouseY}px`;
  contextMenu.style.left = `${mouseX}px`;
  const contextTitle = document.querySelector('#habitTitle');
  if (contextTitle) {
    contextTitle.textContent = habitBtn.dataset.title;
  }
  contextMenu.classList.add('active');
});

// Event: delete habit btn
deleteBtn.addEventListener('click', () => {
  storage.deleteHabit(habitToBeDeleted);
  ui.deleteHabit();
  contextMenu.classList.remove('active');
});

// Close context menu when clicking outside
window.addEventListener('click', e => {
  if (contextMenu.classList.contains('active')) {
    if (e.target.closest('.context-menu')) return;
    contextMenu.classList.remove('active');
  }
});

// Keyboard shortcuts
window.addEventListener('keyup', e => {
  if (e.key !== "Escape") return;

  if (modalContainer.classList.contains('active')) {
    ui.closeModal();
  }

  if (contextMenu.classList.contains('active')) {
    contextMenu.classList.remove('active');
  }
});
