// HTML 요소를 JavaScript에서 사용할 수 있도록 가져옵니다.
const todoInput = document.getElementById("todoInput");
const addTodoButton = document.getElementById("addTodoButton");
const todoList = document.getElementById("todoList");
const messageText = document.getElementById("messageText");
const filterButtons = document.querySelectorAll(".filter-button");
const previousWeekButton = document.getElementById("previousWeekButton");
const nextWeekButton = document.getElementById("nextWeekButton");
const selectedDateText = document.getElementById("selectedDateText");
const weekDateList = document.getElementById("weekDateList");

// 로컬스토리지에 Todo 데이터를 저장할 때 사용할 key입니다.
const TODO_STORAGE_KEY = "vanillaTodoItems";

// Todo 데이터를 저장할 배열입니다.
// 각 Todo는 id, text, isCompleted, date 값을 가집니다.
let todoItems = [];

// 현재 선택된 필터 상태를 저장합니다.
// all: 전체, active: 진행 중, completed: 완료
let currentFilterType = "all";

// 현재 선택된 날짜를 저장합니다.
// 처음에는 오늘 날짜를 기본값으로 사용합니다.
let selectedDate = new Date();

// 현재 보고 있는 주의 월요일 날짜를 저장합니다.
let currentWeekStartDate = getMondayOfWeek(selectedDate);

// 앱이 처음 실행될 때 로컬스토리지에서 Todo 데이터를 불러옵니다.
loadTodoItemsFromStorage();

// 앱이 처음 실행될 때 날짜와 Todo 목록을 화면에 표시합니다.
updateSelectedDateText();
renderWeekDateList();
renderTodoList();

// 추가 버튼을 클릭하면 Todo를 생성합니다.
addTodoButton.addEventListener("click", addTodo);

// 입력창에서 Enter 키를 누르면 Todo를 생성합니다.
todoInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    addTodo();
  }
});

// 이전 주 버튼을 클릭하면 현재 주를 일주일 전으로 이동합니다.
previousWeekButton.addEventListener("click", function () {
  moveCurrentWeek(-7);
});

// 다음 주 버튼을 클릭하면 현재 주를 일주일 뒤로 이동합니다.
nextWeekButton.addEventListener("click", function () {
  moveCurrentWeek(7);
});

// 각 필터 버튼을 클릭하면 현재 필터 상태를 변경합니다.
filterButtons.forEach(function (filterButton) {
  filterButton.addEventListener("click", function () {
    const selectedFilterType = filterButton.dataset.filterType;

    changeFilterType(selectedFilterType);
  });
});

// 새로운 Todo를 추가하는 함수입니다.
function addTodo() {
  const todoText = todoInput.value.trim();

  // 입력값이 비어 있으면 Todo를 추가하지 않고 안내 메시지를 보여줍니다.
  if (todoText === "") {
    showMessage("할 일을 입력한 후 추가해주세요.");
    return;
  }

  // 새로운 Todo 객체를 생성합니다.
  // 현재 선택된 날짜를 YYYY-MM-DD 형식으로 함께 저장합니다.
  const newTodo = {
    id: Date.now(),
    text: todoText,
    isCompleted: false,
    date: formatDateKey(selectedDate),
  };

  // Todo 배열에 새 Todo를 추가합니다.
  todoItems.push(newTodo);

  // 변경된 Todo 배열을 로컬스토리지에 저장합니다.
  saveTodoItemsToStorage();

  // 입력창과 안내 메시지를 초기화합니다.
  todoInput.value = "";
  clearMessage();

  // Todo 개수와 목록을 다시 화면에 반영합니다.
  renderWeekDateList();
  renderTodoList();
}

// 날짜와 필터 상태를 모두 반영해서 화면에 보여줄 Todo만 반환하는 함수입니다.
function getFilteredTodoItems() {
  const selectedDateKey = formatDateKey(selectedDate);

  // 먼저 현재 선택된 날짜에 해당하는 Todo만 걸러냅니다.
  const dateFilteredTodoItems = todoItems.filter(function (todo) {
    return todo.date === selectedDateKey;
  });

  // 그다음 전체 / 진행 중 / 완료 필터를 적용합니다.
  if (currentFilterType === "active") {
    return dateFilteredTodoItems.filter(function (todo) {
      return !todo.isCompleted;
    });
  }

  if (currentFilterType === "completed") {
    return dateFilteredTodoItems.filter(function (todo) {
      return todo.isCompleted;
    });
  }

  return dateFilteredTodoItems;
}

// Todo 목록을 화면에 출력하는 함수입니다.
function renderTodoList() {
  // 기존 목록을 비운 뒤, 현재 todoItems 배열 기준으로 다시 생성합니다.
  todoList.innerHTML = "";

  // 현재 선택된 날짜와 필터 상태에 맞는 Todo만 가져옵니다.
  const filteredTodoItems = getFilteredTodoItems();

  // 보여줄 Todo가 없으면 빈 상태 화면을 출력하고 함수를 종료합니다.
  if (filteredTodoItems.length === 0) {
    renderEmptyState();
    return;
  }

  filteredTodoItems.forEach(function (todo) {
    const todoItem = document.createElement("li");
    todoItem.className = "todo-item";

    const todoText = document.createElement("span");
    todoText.className = "todo-text";
    todoText.textContent = todo.text;

    // 완료 상태라면 취소선 스타일을 적용합니다.
    if (todo.isCompleted) {
      todoText.classList.add("completed");
    }

    const todoActions = document.createElement("div");
    todoActions.className = "todo-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-button edit-button";
    editButton.textContent = "수정";
    editButton.addEventListener("click", function () {
      editTodo(todo.id);
    });

    const completeButton = document.createElement("button");
    completeButton.type = "button";
    completeButton.className = "action-button complete-button";
    completeButton.textContent = todo.isCompleted ? "취소" : "완료";
    completeButton.addEventListener("click", function () {
      toggleTodoCompletion(todo.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button delete-button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", function () {
      deleteTodo(todo.id);
    });

    // 버튼들을 버튼 영역에 추가합니다.
    todoActions.appendChild(editButton);
    todoActions.appendChild(completeButton);
    todoActions.appendChild(deleteButton);

    // Todo 항목에 텍스트와 버튼 영역을 추가합니다.
    todoItem.appendChild(todoText);
    todoItem.appendChild(todoActions);

    // 완성된 Todo 항목을 목록에 추가합니다.
    todoList.appendChild(todoItem);
  });
}

// Todo가 없을 때 빈 상태 화면을 출력하는 함수입니다.
function renderEmptyState() {
  const emptyStateItem = document.createElement("li");
  emptyStateItem.className = "empty-state";

  const emptyStateTitle = document.createElement("p");
  emptyStateTitle.className = "empty-state-title";

  const emptyStateDescription = document.createElement("p");
  emptyStateDescription.className = "empty-state-description";

  // 현재 선택된 필터에 따라 다른 빈 상태 문구를 보여줍니다.
  if (currentFilterType === "active") {
    emptyStateTitle.textContent = "진행 중인 Todo가 없습니다.";
    emptyStateDescription.textContent = "아직 처리할 일이 없거나, 모든 Todo를 완료했어요.";
  } else if (currentFilterType === "completed") {
    emptyStateTitle.textContent = "완료된 Todo가 없습니다.";
    emptyStateDescription.textContent = "완료 버튼을 누르면 이곳에서 완료된 Todo를 확인할 수 있어요.";
  } else {
    emptyStateTitle.textContent = "등록된 Todo가 없습니다.";
    emptyStateDescription.textContent = "입력창에 할 일을 작성하고 추가 버튼을 눌러보세요.";
  }

  emptyStateItem.appendChild(emptyStateTitle);
  emptyStateItem.appendChild(emptyStateDescription);

  todoList.appendChild(emptyStateItem);
}

// Todo 내용을 수정하는 함수입니다.
function editTodo(todoId) {
  const selectedTodo = todoItems.find(function (todo) {
    return todo.id === todoId;
  });

  // 해당 Todo를 찾지 못하면 함수 실행을 멈춥니다.
  if (!selectedTodo) {
    return;
  }

  const editedText = prompt("수정할 내용을 입력하세요.", selectedTodo.text);

  // prompt에서 취소를 누른 경우에는 수정하지 않습니다.
  if (editedText === null) {
    return;
  }

  const trimmedEditedText = editedText.trim();

  // 수정 입력값이 비어 있으면 기존 Todo를 유지하고 안내 메시지를 보여줍니다.
  if (trimmedEditedText === "") {
    showMessage("수정할 내용은 비워둘 수 없습니다.");
    return;
  }

  // 선택된 Todo의 텍스트를 수정합니다.
  selectedTodo.text = trimmedEditedText;

  // 수정된 Todo 배열을 로컬스토리지에 저장합니다.
  saveTodoItemsToStorage();

  clearMessage();

  // 수정된 내용을 화면에 반영합니다.
  renderWeekDateList();
  renderTodoList();
}

// Todo 완료 상태를 변경하는 함수입니다.
function toggleTodoCompletion(todoId) {
  todoItems = todoItems.map(function (todo) {
    if (todo.id === todoId) {
      return {
        ...todo,
        isCompleted: !todo.isCompleted,
      };
    }

    return todo;
  });

  // 완료 상태가 변경된 Todo 배열을 로컬스토리지에 저장합니다.
  saveTodoItemsToStorage();

  clearMessage();

  // 상태 변경 후 Todo 개수와 목록을 다시 반영합니다.
  renderWeekDateList();
  renderTodoList();
}

// Todo를 삭제하는 함수입니다.
function deleteTodo(todoId) {
  todoItems = todoItems.filter(function (todo) {
    return todo.id !== todoId;
  });

  // 삭제 후 변경된 Todo 배열을 로컬스토리지에 저장합니다.
  saveTodoItemsToStorage();

  clearMessage();

  // 삭제 후 Todo 개수와 목록을 다시 반영합니다.
  renderWeekDateList();
  renderTodoList();
}

// 필터 상태를 변경하는 함수입니다.
function changeFilterType(selectedFilterType) {
  currentFilterType = selectedFilterType;

  updateActiveFilterButton();
  clearMessage();
  renderTodoList();
}

// 현재 선택된 필터 버튼에 active 스타일을 적용하는 함수입니다.
function updateActiveFilterButton() {
  filterButtons.forEach(function (filterButton) {
    const filterType = filterButton.dataset.filterType;

    if (filterType === currentFilterType) {
      filterButton.classList.add("active");
    } else {
      filterButton.classList.remove("active");
    }
  });
}

// 현재 보고 있는 주를 이전 주 또는 다음 주로 이동하는 함수입니다.
// dayAmount가 -7이면 이전 주, 7이면 다음 주로 이동합니다.
function moveCurrentWeek(dayAmount) {
  currentWeekStartDate.setDate(currentWeekStartDate.getDate() + dayAmount);

  // 주차를 이동하면 선택 날짜도 해당 주의 월요일로 맞춥니다.
  selectedDate = new Date(currentWeekStartDate);

  updateSelectedDateText();
  clearMessage();
  renderWeekDateList();
  renderTodoList();
}

// 주간 날짜 목록을 화면에 출력하는 함수입니다.
function renderWeekDateList() {
  weekDateList.innerHTML = "";

  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];

  for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
    const date = new Date(currentWeekStartDate);
    date.setDate(currentWeekStartDate.getDate() + dayIndex);

    const dateKey = formatDateKey(date);
    const todoCount = getTodoCountByDate(dateKey);

    const dateButton = document.createElement("button");
    dateButton.type = "button";
    dateButton.className = "week-date-button";

    // 오늘 날짜라면 today 클래스를 추가합니다.
    if (isSameDate(date, new Date())) {
      dateButton.classList.add("today");
    }

    // 현재 선택된 날짜라면 selected 클래스를 추가합니다.
    if (isSameDate(date, selectedDate)) {
      dateButton.classList.add("selected");
    }

    const dayName = document.createElement("span");
    dayName.className = "week-day-name";
    dayName.textContent = dayNames[dayIndex];

    const dayNumber = document.createElement("span");
    dayNumber.className = "week-day-number";
    dayNumber.textContent = date.getDate();

    const todoCountText = document.createElement("span");
    todoCountText.className = "week-todo-count";
    todoCountText.textContent = `${todoCount}개`;

    dateButton.appendChild(dayName);
    dateButton.appendChild(dayNumber);
    dateButton.appendChild(todoCountText);

    // 날짜를 클릭하면 해당 날짜의 Todo만 목록에 표시합니다.
    dateButton.addEventListener("click", function () {
      selectDate(date);
    });

    weekDateList.appendChild(dateButton);
  }
}

// 특정 날짜를 선택하는 함수입니다.
function selectDate(date) {
  selectedDate = new Date(date);

  updateSelectedDateText();
  clearMessage();
  renderWeekDateList();
  renderTodoList();
}

// 특정 날짜에 저장된 Todo 개수를 계산하는 함수입니다.
function getTodoCountByDate(dateKey) {
  return todoItems.filter(function (todo) {
    return todo.date === dateKey;
  }).length;
}

// 선택된 날짜를 화면에 표시하는 함수입니다.
function updateSelectedDateText() {
  selectedDateText.textContent = formatDateDisplay(selectedDate);
}

// 특정 날짜가 속한 주의 월요일을 구하는 함수입니다.
function getMondayOfWeek(date) {
  const copiedDate = new Date(date);
  const day = copiedDate.getDay();

  // JavaScript의 getDay()는 일요일이 0, 월요일이 1입니다.
  // 월요일 시작 기준으로 맞추기 위해 일요일은 -6일, 나머지는 1 - day만큼 이동합니다.
  const diff = day === 0 ? -6 : 1 - day;

  copiedDate.setDate(copiedDate.getDate() + diff);

  return copiedDate;
}

// 날짜를 Todo 저장용 key 형식으로 변환하는 함수입니다.
// 예: 2026-06-02
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// 날짜를 화면 표시용 형식으로 변환하는 함수입니다.
// 예: 2026년 6월 2일 화요일
function formatDateDisplay(date) {
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

// 두 날짜가 같은 연도, 같은 월, 같은 일인지 확인하는 함수입니다.
function isSameDate(firstDate, secondDate) {
  return formatDateKey(firstDate) === formatDateKey(secondDate);
}

// Todo 배열을 로컬스토리지에 저장하는 함수입니다.
function saveTodoItemsToStorage() {
  // 배열이나 객체는 그대로 저장할 수 없기 때문에 JSON 문자열로 변환합니다.
  const todoItemsJson = JSON.stringify(todoItems);

  localStorage.setItem(TODO_STORAGE_KEY, todoItemsJson);
}

// 로컬스토리지에서 Todo 데이터를 불러오는 함수입니다.
function loadTodoItemsFromStorage() {
  const savedTodoItemsJson = localStorage.getItem(TODO_STORAGE_KEY);

  // 저장된 데이터가 없으면 빈 배열 상태를 유지합니다.
  if (savedTodoItemsJson === null) {
    todoItems = [];
    return;
  }

  // JSON 문자열을 JavaScript 배열로 변환합니다.
  todoItems = JSON.parse(savedTodoItemsJson);
}

// 안내 메시지를 표시하는 함수입니다.
function showMessage(message) {
  messageText.textContent = message;
}

// 안내 메시지를 지우는 함수입니다.
function clearMessage() {
  messageText.textContent = "";
}